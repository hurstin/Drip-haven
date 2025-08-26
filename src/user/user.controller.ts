import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  ClassSerializerInterceptor,
  UseInterceptors,
  HttpCode,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { Roles } from 'src/auth/decorator/roles.decorator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
@UseInterceptors(ClassSerializerInterceptor) // works with clas-transfomer in entity
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Public()
  @Get('myProfile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'view current user profile' })
  @ApiOkResponse({ description: 'user profile retrieved successfully' })
  @ApiBadRequestResponse({ description: 'unauthorized user' })
  // @Roles('admin')
  // @UseGuards(JwtAuthGuard)
  getMyProfile(@Request() req) {
    return this.userService.showCurrentUser(req.user.email);
  }

  @Patch('me/update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'update your credentials' })
  @ApiOkResponse({ description: 'user profile updated successfully' })
  @ApiBadRequestResponse({ description: 'update not successful' })

  // No @Roles() decorator -> all authenticated users can access this
  // @Roles('admin', 'user', 'washer')
  updateMe(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const { userId } = req.user;
    return this.userService.updateMyProfile(userId, updateUserDto);
  }

  @Delete('deleteMe')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'delete your account' })
  @ApiOkResponse({ description: 'your profile deleted successfully' })
  @ApiBadRequestResponse({ description: 'unsuccessfully deletion' })
  @HttpCode(204)
  deleteMe(@Request() req: any) {
    const { userId } = req.user;
    return this.userService.deleteProfile(userId);
  }

  @Post('profile-picture')
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload profile picture',
    description:
      'Upload a new profile picture for the authenticated user. Supports JPG, PNG, GIF formats up to 5MB.',
  })
  @ApiOkResponse({
    description: 'Profile picture uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example:
            'https://res.cloudinary.com/example/image/upload/v123/profile.jpg',
        },
        publicId: { type: 'string', example: 'profile-pictures/abc123' },
        width: { type: 'number', example: 400 },
        height: { type: 'number', example: 400 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid file format, file too large, or upload failed',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture file (JPG, PNG, GIF)',
        },
      },
    },
  })
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.userService.updateProfilePicture(req.user.userId, file);
  }

  @Delete('profile-picture')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove profile picture',
    description:
      'Remove the current profile picture for the authenticated user',
  })
  @ApiOkResponse({
    description: 'Profile picture removed successfully',
    schema: {
      type: 'object',
      properties: {
        profilePictureUrl: { type: 'string', example: null },
        profilePicturePublicId: { type: 'string', example: null },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'No profile picture found or removal failed',
  })
  async removeProfilePicture(@Request() req: any) {
    return this.userService.removeProfilePicture(req.user.userId);
  }

  // @Patch('update-user')
  // @Roles('admin')
  // updateUser() {}
}
