import {
  Controller,
  Request,
  Post,
  UseGuards,
  Body,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SetMetadata } from '@nestjs/common';
import { RolesGuard } from './guards/roles.guard';
import { User } from 'src/db';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: { user: User }) {
    return this.authService.login(req.user);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refreshToken(@Request() req: { user: User }) {
    return this.authService.refreshToken(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: User }) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['admin'])
  @Post('assign-role')
  assignRole(@Request() req: { user: User }, @Body('role') role: string) {
    return this.authService.assignRole(req.user.id, role);
  }

  @Post('register')
  async register(@Body() authDto: AuthDto) {
    return await this.authService.register(authDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req: { user: User },
    @Body('password') password: string,
  ) {
    return await this.authService.changePassword(req.user.id, password);
  }

  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Request() req: { user: User },
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(
      req.user.resetPasswordToken || '',
      password,
    );
  }
}
