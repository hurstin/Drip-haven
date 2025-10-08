import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ClassSerializerInterceptor,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportLocalGuard } from './guards/passport-local.guard';
import { CreateUserDto } from './dto/create-user-auth.dto';
import { Public } from './decorator/public.decorator';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { CreateUserResponsedto } from './dto/create-user-response.dto';
// import { Serialize } from 'src/interceptors/serialize.interceptor';
import { loginDto } from './dto/login-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor) // works with clas-transfomer in entity
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Creates a new user' })
  @ApiCreatedResponse({
    description: 'new user created successfully',
    // type: CreateUserResponsedto,
  })
  // @ApiOkResponse({description:'u'})
  @ApiBadRequestResponse({ description: 'invalid data provided' })
  // @Serialize(CreateUserResponsedto)
  signup(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    return this.authService.signup(createUserDto, req);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'verify user email' })
  @ApiOkResponse({ description: 'user verified successfully' })
  @ApiBadRequestResponse({
    description: 'invalid token',
  })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'user log in' })
  @ApiOkResponse({ description: 'user logged in successfully' })
  @ApiBadRequestResponse({
    description: 'invalid credentials or not verified user',
  })
  @UseGuards(PassportLocalGuard)
  login(@Request() req, @Body() loginDto: loginDto) {
    return this.authService.login(req.user);
  }

  @Patch('updatePassword')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'update your password' })
  @ApiOkResponse({ description: 'password updated successfully' })
  @ApiBadRequestResponse({ description: 'incorrect value' })
  updatePassword(@Request() req) {
    // req.user is the user object returned by the Passport strategy
    return this.authService.updatePassword(req);
  }

  @Public()
  @Post('forgotPassword')
  @ApiOperation({ summary: 'forgot password input email' })
  @ApiOkResponse({ description: 'reset token sent to email' })
  @ApiBadRequestResponse({
    description: 'incorrect email',
  })
  forgotPassword(@Request() req, @Body() email: ForgotPasswordDto) {
    return this.authService.forgotPassword(email.email, req);
  }

  @Public()
  @Patch('resetPassword/:token')
  @ApiOperation({ summary: 'reset user password' })
  @ApiOkResponse({ description: 'password reset successfully' })
  @ApiBadRequestResponse({
    description: 'reset token expired or incorrect, incoorent credentials',
  })
  resetPassword(@Param('token') token: string, @Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(token, body);
  }
}
