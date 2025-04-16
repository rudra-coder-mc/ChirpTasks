import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { DrizzleDatabase, User, users, DB_PROVIDER_TOKEN } from '../../db';
import { eq } from 'drizzle-orm';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService, @Inject(DB_PROVIDER_TOKEN) private db: DrizzleDatabase) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any): Promise<any> {
    const authHeader = req.get('Authorization')
    if (!authHeader) {
      return null;
    }
    const refreshToken = authHeader.replace('Bearer ', '').trim();
    const user = await this.db.select().from(users).where(eq(users.id, payload.sub)).get();

    if (!user) {
      return null;
    }

    return {
      ...user,
      refreshToken,
    };
  }
}