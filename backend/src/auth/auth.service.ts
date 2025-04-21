import {
  Injectable,
  UnauthorizedException,
  Inject,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { DB_PROVIDER_TOKEN, DrizzleDatabase, User, users } from '../db';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { Response } from '../utils/response';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(DB_PROVIDER_TOKEN) private db: DrizzleDatabase,
  ) {}

  async validateUser(authDto: AuthDto): Promise<User | undefined> {
    try {
      const user = this.db
        .select()
        .from(users)
        .where(eq(users.email, authDto.username))
        .get();

      if (!user) {
        return undefined;
      }

      const isPasswordValid = await bcrypt.compare(
        authDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        return undefined;
      }

      return user;
    } catch (error) {
      console.log('Error in validateUser:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async login(user: User) {
    try {
      const payload = {
        username: user.name,
        email: user.email,
        sub: user.id,
        role: user.role,
      };
      const refreshToken = await this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        {
          secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: this.configService.get<string>(
            'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
          ),
        },
      );

      this.db
        .update(users)
        .set({ refreshToken: refreshToken })
        .where(eq(users.id, user.id))
        .run();

      return Response.success('Login successful', {
        access_token: await this.jwtService.signAsync(payload),
        refresh_token: refreshToken,
      });
    } catch (error) {
      return Response.error(
        'Login failed',
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async refreshToken(user: User) {
    try {
      const payload = {
        username: user.name,
        email: user.email,
        sub: user.id,
        role: user.role,
      };

      return Response.success('Refresh token successful', {
        access_token: await this.jwtService.signAsync(payload),
      });
    } catch (error) {
      return Response.error(
        'Refresh token failed',
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  assignRole(userId: number, role: string) {
    try {
      this.db
        .update(users)
        .set({ role: role })
        .where(eq(users.id, userId))
        .run();
      return Response.success('Role assigned successfully', null);
    } catch (error: any) {
      return Response.error(
        'Failed to assign role',
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async register(authDto: AuthDto) {
    try {
      const hashedPassword = await bcrypt.hash(authDto.password, 10);

      this.db
        .insert(users)
        .values({
          email: authDto.username,
          password: hashedPassword,
          name: authDto.username,
        })
        .get();

      return Response.success('User registered successfully', null);
    } catch (error) {
      return Response.error(
        'Failed to register user',
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async changePassword(userId: number, password: string) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      this.db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId))
        .run();
      return Response.success('Password changed successfully', null);
    } catch (error: any) {
      return Response.error(
        'Failed to change password',
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  forgotPassword(email: string) {
    try {
      let user: User | undefined;
      try {
        user = this.db.select().from(users).where(eq(users.email, email)).get();
      } catch (error) {
        return Response.error(
          'Failed to find user',
          error,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const resetPasswordToken = uuidv4();
      const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

      try {
        this.db
          .update(users)
          .set({ resetPasswordToken, resetPasswordExpires })
          .where(eq(users.id, user.id))
          .run();
      } catch (error: any) {
        return Response.error(
          'Failed to update reset password token',
          error,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // TODO: Send email with reset password link
      // this.logger.log(
      //   `Reset password link: http://localhost:3000/auth/reset-password?token=${resetPasswordToken}`,
      // );

      return Response.success('Forgot password email sent successfully', null);
    } catch (error) {
      return Response.error(
        'Failed to forgot password',
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async resetPassword(resetPasswordToken: string, password: string) {
    try {
      let user: User | undefined;
      try {
        user = this.db
          .select()
          .from(users)
          .where(eq(users.resetPasswordToken, resetPasswordToken))
          .get();
      } catch (error) {
        return Response.error(
          'Failed to find user with reset token',
          error,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (!user) {
        throw new UnauthorizedException('Invalid reset password token');
      }

      if (user.resetPasswordExpires! < new Date()) {
        throw new UnauthorizedException('Reset password token has expired');
      }

      let hashedPassword: string;
      try {
        hashedPassword = await bcrypt.hash(password, 10);
      } catch (error) {
        return Response.error(
          'Failed to hash password',
          error,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      try {
        this.db
          .update(users)
          .set({
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
          })
          .where(eq(users.id, user.id))
          .run();
      } catch (error: any) {
        return Response.error(
          'Failed to reset password',
          error,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return Response.success('Password reset successfully', null);
    } catch (error) {
      return Response.error(
        'Failed to reset password',
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
