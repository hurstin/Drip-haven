import { ApiProperty } from '@nestjs/swagger';
import { Equals } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty()
  currentPassword: string;

  @ApiProperty()
  newPassword: string;

  @ApiProperty()
  @Equals('newPassword', {
    message: 'Password and confirm password do not match',
  })
  passwordConfirm: string;
}
