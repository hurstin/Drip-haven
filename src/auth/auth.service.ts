import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ValidateDto } from './dto/validate-user.dto';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateUserDto } from './dto/create-user-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { generateResetToken } from '../utils/tokens.util';
import { MailerService } from '@nestjs-modules/mailer';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async signup(createUserDto: CreateUserDto, req: any) {
    // check if email eixst in db
    if (await this.userService.findOne(createUserDto.email))
      throw new BadRequestException('email exists already');

    //  create user and save to DB
    const user = await this.userService.create(createUserDto, req);

    return user;
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('verification token missing.');
    }

    const user = await this.userService.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;
    await this.userService.saveUser(user);

    return { message: 'Email successfully verified, please login' };
  }

  async validateUser(validateDto: ValidateDto) {
    const { email, password } = validateDto;

    // query user from db
    const user = await this.userService.findOne(email);

    // check if user existed
    if (!user) throw new UnauthorizedException('incorrect credentials');

    // check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) throw new UnauthorizedException('incorrect credentials');

    return user;
  }

  async login(user: any) {
    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),

      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  async updatePassword(req: any) {
    // query user from db with password
    const currentUser = await this.userService.findOne(req.user.email);

    // check if user Existed
    if (!currentUser) throw new BadRequestException('user not found');

    // check if newpassword and passwordconfirm match
    if (req.body.newPassword !== req.body.passwordConfirm)
      throw new BadRequestException('password confirm does not match');

    // check if old password and new password are the same
    if (req.body.currentPassword === req.body.newPassword)
      throw new BadRequestException(
        'new password cannot be the same as current password',
      );

    // check if password is correct
    const isMatch = await bcrypt.compare(
      req.body.currentPassword,
      currentUser.password,
    );

    if (!isMatch) throw new BadRequestException('incorrect password');

    // update password
    const updatedUser = await this.userService.updatePassword(
      currentUser.email,
      req.body.newPassword,
    );

    return { message: 'Password updated successfully', updatedUser };
  }

  async forgotPassword(email: string, req: any) {
    // check if email is provided
    if (!email) throw new BadRequestException('please provide email');

    // check if user exists
    const user = await this.userService.findOne(email);

    if (!user) throw new BadRequestException('user not found');

    // generate a reset token
    const resetToken = generateResetToken();

    // hash the token and set expiration time before saving to db
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins from now

    // save the hashed token and expiration time to the user record
    await this.userService.updateResetToken(email, hashedToken, expires);
    // send the token to the user's email
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/resetPassword/${resetToken}`;

    const message = `forgot your password? send a PATCH request with your new password and password confrim to :${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
      await this.mailerService.sendMail({
        from: 'Drip Haven',
        to: user.email,
        subject: 'Reset password(expires in 10 minutes)',
        text: message,
      });
    } catch (error) {
      console.log('error=>', error);
      this.userService.updateResetToken(email, null, null); // clear the token if email fails to send
      throw new BadRequestException('error sending email,please try again');
    }
    return {
      message: 'Reset token sent to email',
      status: 'success',
      hashedToken,
    };
  }

  async resetPassword(token: string, body: ResetPasswordDto) {
    const { password, passwordConfirm } = body;
    // check if token is provided
    // hash the token to compare with the one in the db
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // find user based on token
    const user = await this.userService.findByResetToken(hashedToken);

    // check if user exists and token is not expired
    if (!user) throw new BadRequestException('invalid or expired reset token');

    // set new password
    if (password !== passwordConfirm)
      throw new BadRequestException('password confirm does not match');

    // update user password
    const updatedUser = await this.userService.updatePassword(
      user.email,
      password,
    );

    return {
      user: updatedUser.email,
      message: 'password reset successfully, login in again',
      status: 'success',
    };
  }
}
