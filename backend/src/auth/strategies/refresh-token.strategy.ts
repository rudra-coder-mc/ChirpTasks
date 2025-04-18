import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { DrizzleDatabase, User, users, DB_PROVIDER_TOKEN } from '../../db';
import { eq } from 'drizzle-orm';

const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['refresh_token'] || null;
  }
  return null;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    @Inject(DB_PROVIDER_TOKEN) private db: DrizzleDatabase,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      secretOrKey: configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any): Promise<any> {
    let refreshToken: string | null = null;

    const authHeader = req.get('Authorization');
    if (authHeader) {
      refreshToken = authHeader.replace('Bearer ', '').trim();
    }

    if (!refreshToken && req.cookies) {
      refreshToken = req.cookies['refresh_token'] || null;
    }

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const user =  this.db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .get();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const storedRefreshToken = this.db
      .select({ refreshToken: users.refreshToken })
      .from(users)
      .where(eq(users.id, user.id))
      .get();

    if (!storedRefreshToken || storedRefreshToken.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      ...user,
      refreshToken,
    };
  }
}