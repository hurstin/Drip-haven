import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
  HttpCode,
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
} from '@nestjs/swagger';

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
  deleteMe(@Request() req) {
    const { userId } = req.user;
    return this.userService.deleteProfile(userId);
  }

  // @Patch('update-user')
  // @Roles('admin')
  // updateUser() {}
}
