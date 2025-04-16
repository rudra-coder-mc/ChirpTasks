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
    const user = await this.db.select().from(users).where(eq(users.email, authDto.username)).get();

    if (!user) {
      return undefined;
    }

    const isPasswordValid = await bcrypt.compare(authDto.password, user.password!);

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
          expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
        },
      ),
    };
  }

  async refreshToken(user: any) {
    const payload = { username: user.name, sub: user.id, roles: [user.role] };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async assignRole(userId: number, role: string) {
    await this.db.update(users).set({ role: role }).where(eq(users.id, userId)).run()
     return { message: 'Role assigned successfully' };
  }

  async register(authDto: AuthDto) {
    const hashedPassword = await bcrypt.hash(authDto.password, 10);
    await this.db.insert(users).values({ email: authDto.username, password: hashedPassword, name: authDto.username }).run();
    return { message: 'User registered successfully' };
  }

  async changePassword(userId: number, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId)).run();
    return { message: 'Password changed successfully' };
  }



  async forgotPassword(email: string) {
    const user = await this.db.select().from(users).where(eq(users.email, email)).get();

    if (!user) {
      return { message: 'Forgot password email sent successfully' }; // Don't reveal if email exists or not
    }

    const resetPasswordToken = uuidv4();
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.db.update(users).set({ resetPasswordToken, resetPasswordExpires }).where(eq(users.id, user.id)).run();

    // TODO: Send email with reset password link
    console.log(`Reset password link: http://localhost:3000/auth/reset-password?token=${resetPasswordToken}`);

    return { message: 'Forgot password email sent successfully' };
  }

  async resetPassword(resetPasswordToken: string, password: string) {
    const user = await this.db.select().from(users).where(eq(users.resetPasswordToken, resetPasswordToken)).get();

    if (!user) {
      throw new UnauthorizedException('Invalid reset password token');
    }

    if (user.resetPasswordExpires! < new Date()) {
      throw new UnauthorizedException('Reset password token has expired');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.db.update(users).set({ password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null }).where(eq(users.id, user.id)).run();

    return { message: 'Password reset successfully' };
  }
}