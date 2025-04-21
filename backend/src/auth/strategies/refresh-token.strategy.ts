import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express'; // Use type import
import { ConfigService } from '@nestjs/config';
import { DrizzleDatabase, users, DB_PROVIDER_TOKEN } from '../../db';
import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm'; // Import type for user

// Define an interface for the expected JWT payload
interface JwtPayload {
  sub: number; // Assuming 'sub' is the user ID and is a number
  // Add other expected payload fields if necessary
  // email: string;
  iat: number;
  exp: number;
}

// Define a type for the user object returned by Drizzle
type User = InferSelectModel<typeof users>;

// Define a type for the request object potentially augmented by cookie-parser

type RequestWithCookies = Request & {
  cookies?: Record<string, string>;
};

const cookieExtractor = (req: RequestWithCookies): string | null => {
  // Check specifically for req.cookies existence and type
  if (req && req.cookies && typeof req.cookies === 'object') {
    // Access cookie safely
    return (req.cookies as Record<string, string>)['refresh_token'] ?? null; // Use nullish coalescing
  }
  return null;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    @Inject(DB_PROVIDER_TOKEN) private db: DrizzleDatabase,
  ) {
    const secret = configService.get<string>('JWT_REFRESH_TOKEN_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_TOKEN_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      secretOrKey: secret,
      passReqToCallback: true, // Keep this true to access the request in validate
    });
  }

  // Update validate signature: type payload and change return type (remove Promise)
  // The return type should match what your application expects after successful validation
  validate(
    req: RequestWithCookies,
    payload: JwtPayload,
  ): User & { refreshToken: string } {
    // 1. Extract the actual token from the request
    // Passport doesn't pass the raw token, so we need passReqToCallback: true
    // and extract it again here to compare with the stored one.
    let refreshToken: string | null = null;

    const authHeader = req.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // Check prefix safely
      refreshToken = authHeader.substring(7); // Use substring for clarity
    } else if (req.cookies && typeof req.cookies === 'object') {
      refreshToken =
        (req.cookies as Record<string, string>)['refresh_token'] ?? null;
    }

    if (!refreshToken) {
      // This case should ideally be caught by Passport's extraction logic,
      // but double-checking doesn't hurt.
      throw new UnauthorizedException('No refresh token provided in request');
    }

    // 2. Validate payload content (optional but good practice)
    if (!payload || typeof payload.sub !== 'number') {
      throw new UnauthorizedException('Invalid token payload');
    }

    // 3. Fetch user based on payload subject (user ID)
    // Drizzle's .get() is synchronous and returns the user or undefined
    const user = this.db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub)) // Use typed payload.sub
      .get(); // .get() is synchronous

    if (!user) {
      throw new UnauthorizedException('User associated with token not found');
    }

    // 4. Compare the received token with the stored token
    // We already fetched the full user, so we can access user.refreshToken directly
    if (!user.refreshToken || user.refreshToken !== refreshToken) {
      // Important: Consider invalidating the user's session or tokens here
      // if a mismatch occurs, as it might indicate token theft.
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 5. Return the validated user object along with the token
    // The returned object will be attached to req.user
    return {
      ...user,
      refreshToken, // Include the validated refresh token
    };
  }
}
