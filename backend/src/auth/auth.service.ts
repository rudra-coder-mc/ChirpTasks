import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { DB_PROVIDER_TOKEN, DrizzleDatabase, User, users } from '../db';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(DB_PROVIDER_TOKEN) private db: DrizzleDatabase,
  ) {}

  async validateUser(authDto: AuthDto): Promise<User | undefined> {
    console.log(`Validating user: ${authDto.username}`);
    let user: User | undefined;
    try {
      user = this.db
        .select()
        .from(users)
        .where(eq(users.email, authDto.username))
        .get();
      console.log(`User found: ${user?.email}`);
    } catch (error) {
      console.error(`Error validating user: ${error}`);
      return undefined;
    }

    if (!user) {
      console.log(`User not found: ${authDto.username}`);
      return undefined;
    }

    const isPasswordValid = await bcrypt.compare(
      authDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      return undefined;
    }

    //const { password, ...result } = user;
    return user;
  }

  async login(user: User) {
    const payload = { username: user.name, sub: user.id, roles: [user.role] };
    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: await this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        {
          secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: this.configService.get<string>(
            'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
          ),
        },
      ),
    };
  }

  async refreshToken(user: User) {
    const payload = { username: user.name, sub: user.id, roles: [user.role] };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  assignRole(userId: number, role: string) {
    try {
      this.db
        .update(users)
        .set({ role: role })
        .where(eq(users.id, userId))
        .run();
      console.log(`Role assigned successfully to user ${userId}: ${role}`);
      return { message: 'Role assigned successfully' };
    } catch (error: any) {
      console.error(`Error assigning role to user ${userId}: ${error}`);
      throw new Error('Failed to assign role');
    }
  }

  async register(authDto: AuthDto) {
    try {
      if (!authDto?.password || !authDto?.username) {
        return new UnauthorizedException('Password or user is required');
      }

      const hashedPassword = await bcrypt.hash(authDto.password, 10);

      const data = this.db
        .insert(users)
        .values({
          email: authDto.username,
          password: hashedPassword,
          name: authDto.username,
        })
        .run();
      console.log(`User registered successfully: ${authDto.username}`);

      return { message: 'User registered successfully', data };
    } catch (dbError) {
      console.error(`Error inserting user into database: ${dbError}`);
      return new Error('Failed to register user');
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
      console.log(`Password changed successfully for user ${userId}`);
      return { message: 'Password changed successfully' };
    } catch (error: any) {
      console.error(`Error changing password for user ${userId}: ${error}`);
      throw new Error('Failed to change password');
    }
  }

  forgotPassword(email: string) {
    let user: User | undefined;
    try {
      user = this.db.select().from(users).where(eq(users.email, email)).get();
    } catch (error) {
      console.error(`Error finding user with email ${email}: ${error}`);
      throw new Error('Failed to find user');
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
      console.log(`Reset password token updated for user ${user.id}`);
    } catch (error: any) {
      console.error(
        `Error updating reset password token for user ${user.id}: ${error}`,
      );
      throw new Error('Failed to update reset password token');
    }

    // TODO: Send email with reset password link
    console.log(
      `Reset password link: http://localhost:3000/auth/reset-password?token=${resetPasswordToken}`,
    );

    return { message: 'Forgot password email sent successfully' };
  }

  async resetPassword(resetPasswordToken: string, password: string) {
    let user: User | undefined;
    try {
      user = this.db
        .select()
        .from(users)
        .where(eq(users.resetPasswordToken, resetPasswordToken))
        .get();
    } catch (error) {
      console.error(
        `Error finding user with reset token ${resetPasswordToken}: ${error}`,
      );
      throw new Error('Failed to find user with reset token');
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
    } catch (hashingError) {
      console.error(
        `Error hashing password for user ${user.id}: ${hashingError}`,
      );
      throw new Error('Failed to hash password');
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
      console.log(`Password reset successfully for user ${user.id}`);
    } catch (error: any) {
      console.error(`Error updating password for user ${user.id}: ${error}`);
      throw new Error('Failed to reset password');
    }

    return { message: 'Password reset successfully' };
  }
}
