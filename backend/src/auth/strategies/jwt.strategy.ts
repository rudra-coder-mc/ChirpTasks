import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DrizzleDatabase, User, users, DB_PROVIDER_TOKEN } from '../../db';
import { eq } from 'drizzle-orm';

interface JwtPayload {
  sub: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @Inject(DB_PROVIDER_TOKEN) private db: DrizzleDatabase,
  ) {
    const secret = configService.get<string>('JWT_ACCESS_TOKEN_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_TOKEN_SECRET is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload) {
    const user: User | undefined = this.db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .get();
    if (!user) {
      return null;
    }
    return user;
  }
}
