import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { MoreThan, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid
import { addHours } from 'date-fns'; // npm i date-fns
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private mailerService: MailerService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(createUserDto: CreateUserDto, req: any) {
    const verificationToken = uuidv4();
    const tokenExpires = addHours(new Date(), 1); //expires in 1 hour
    // 1. Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    // 2. Create user object (spread the DTO, set hashed password)
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.USER, // default to 'user' if not provided
      isVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpires: tokenExpires,
    });
    // send verification token to email
    // const verificationUrl = `https://your-domain.com/auth/verify-email?token=${verificationToken}`; // for real domain

    const verificationURL = `${req.protocol}://${req.get(
      'host',
    )}/auth/verify-email?token=${verificationToken}`;

    const html = `<!DOCTYPE html>
     <html lang="en">
     <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email Address</title>
        <style>
            /* Reset styles */
            body, html {
                margin: 0;
                padding: 0;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f7f9fc;
            }

            /* Container */
            .container {
                max-width: 600px;
                margin: 30px auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
            }

            /* Header */
            .header {
                background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
                padding: 40px 20px;
                text-align: center;
                color: white;
            }

            .logo {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 10px;
                letter-spacing: 0.5px;
            }

            /* Content */
            .content {
                padding: 40px 30px;
            }

            h1 {
                color: #2d3748;
                margin-top: 0;
                font-size: 28px;
                text-align: center;
            }

            p {
                margin-bottom: 25px;
                font-size: 16px;
                text-align: center;
                color: #4a5568;
            }

            /* Button */
            .button-container {
                text-align: center;
                margin: 35px 0;
            }

            .verify-button {
                display: inline-block;
                background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
                color: white !important;
                text-decoration: none;
                font-weight: 600;
                font-size: 16px;
                padding: 16px 40px;
                border-radius: 50px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(37, 117, 252, 0.3);
            }

            .verify-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 7px 20px rgba(37, 117, 252, 0.4);
            }

            /* Footer */
            .footer {
                text-align: center;
                padding: 25px;
                background: #f0f4f9;
                color: #718096;
                font-size: 14px;
            }

            .footer a {
                color: #4299e1;
                text-decoration: none;
            }

            .small {
                font-size: 13px;
                color: #a0aec0;
                margin-top: 25px;
                line-height: 1.5;
            }

            /* Responsive */
            @media screen and (max-width: 600px) {
                .container {
                    margin: 15px;
                    border-radius: 8px;
                }

                .header, .content {
                    padding: 30px 20px;
                }

                h1 {
                    font-size: 24px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Drip Haven</div>
                <h2>Email Verification</h2>
            </div>

            <div class="content">
                <h1>Confirm Your Email Address</h1>
                <p>Thanks for registering! Please verify your email address to activate your account and start using our services.</p>

                <div class="button-container">
                    <a href="${verificationURL}" class="verify-button">Verify Email Address</a>
                </div>

                <p>If you didn't create an account with us, please ignore this email.</p>

                <p class="small">
                    Having trouble with the button?<br>
                    Copy and paste this URL into your browser:<br>
                    <span style="color: #4299e1; word-break: break-all;">${verificationURL}</span>
                </p>
            </div>

            <div class="footer">
                <p>&copy; 2025 YourAppName. All rights reserved.</p>
                <p><a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a> | <a href="#">Contact Us</a></p>
                <p class="small">
                    This email was sent to you as part of our account verification process.<br>
                    Please do not reply to this automated message.
                </p>
            </div>
        </div>
    </body>
    </html>`;

    // const message = `<p>Click <a href="${verificationURL}">here</a> to verify your email.</p>`;

    try {
      await this.mailerService.sendMail({
        from: 'Drip Haven',
        to: user.email,
        subject: 'Verify your email',
        html: html.replace('${verificationURL}', verificationURL),
        // text: message,
      });
    } catch (error) {
      console.log('error=>', error);
      throw new BadRequestException('error sending email,please try again');
    }

    // 3. Save user
    const savedUser = await this.usersRepository.save(user);

    // 4. Optionally, remove password before returning
    const { password, ...result } = savedUser;
    return {
      result,
      message: 'use created. Please check your email to verify.',
    };
  }

  // async findOneWithPass(email: string): Promise<User | null> {
  //   const user = await this.usersRepository.findOne({
  //     where: { email },
  //     select: ['id', 'email', 'password'],
  //   });
  //   return user;
  // }

  async findOne(email: string) {
    const user = await this.usersRepository.findOneBy({ email });
    return user;
  }

  async showCurrentUser(email: string): Promise<User | null> {
    // Use findOneBy() for single result

    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['washerProfile'],
    });

    if (!user) throw new BadRequestException('user not found');
    return user;
  }

  async updateMyProfile(userId: number, updateUserDto: UpdateUserDto) {
    //  get user by id from db
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new BadRequestException('User not found please login');

    // 2. Check if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      // 3. Verify new email is available
      const emailExists = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
        select: ['id'], // Only get ID for existence check
      });

      if (emailExists) {
        throw new ConflictException('Email already in use by another account');
      }
    }

    // update user with new data
    Object.assign(user, updateUserDto);

    // save user to db
    const updatedUser = await this.usersRepository.save(user);

    // return user without password
    return updatedUser;
  }

  async updatePassword(email: string, password: string) {
    const user = await this.usersRepository.findOneBy({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const salt = await bcrypt.genSalt();

    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    // Update user password
    const updatedUser = await this.usersRepository.save({
      ...user,
      password: hashedPassword,
      passwordResetExpires: null,
      passwordResetToken: null,
      passwordChangedAt: new Date(),
    });

    // Return user without password
    const { password: _password, ...result } = updatedUser;
    return result as User;
  }

  async updateResetToken(
    email: string,
    resetToken: string | null,
    expires: Date | null,
  ) {
    // Find the user by email
    const user = await this.usersRepository.findOneBy({ email });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Update the user's reset token and expiration
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = expires;

    // Save the updated user
    return this.usersRepository.save(user);
  }

  async findByResetToken(resetToken: string) {
    // get user by resetToken and check if token is not expired
    const user = await this.usersRepository.findOneBy({
      passwordResetToken: resetToken,
      passwordResetExpires: MoreThan(new Date()), //ensure token is not expired
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    return user;
  }

  async findByVerificationToken(token: string) {
    // get user by token and check if token is not expired
    const user = await this.usersRepository.findOneBy({
      emailVerificationToken: token,
      emailVerificationTokenExpires: MoreThan(new Date()), //ensure token is not expired
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    return user;
  }

  async saveUser(user: any) {
    return await this.usersRepository.save(user);
  }

  async deleteProfile(userId: number) {
    // get user by id from db
    const user = await this.usersRepository.findOneBy({ id: userId });

    if (!user) throw new BadRequestException('User not found please login');

    // delete user from db
    await this.usersRepository.delete(userId);

    return {
      messsage: 'user deleted successfully',
      user: user.email,
    };
  }

  async findById(userId: number) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) return;
    return user;
  }

  async updateProfilePicture(userId: number, file: Express.Multer.File) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete old profile picture if exists
    if (user.profilePicturePublicId) {
      await this.cloudinaryService.deleteImage(user.profilePicturePublicId);
    }

    // Upload new image
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'profile-pictures',
    );

    // Update user profile
    user.profilePictureUrl = uploadResult.url;
    user.profilePicturePublicId = uploadResult.publicId;

    return this.usersRepository.save(user);
  }

  async removeProfilePicture(userId: number) {
    if (!userId) throw new NotFoundException('userId not found');
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.profilePicturePublicId) {
      throw new NotFoundException('Profile picture not found');
    }

    // Delete from Cloudinary
    await this.cloudinaryService.deleteImage(user.profilePicturePublicId);

    // Update user profile
    user.profilePictureUrl = null;
    user.profilePicturePublicId = null;

    return this.usersRepository.save(user);
  }
}
