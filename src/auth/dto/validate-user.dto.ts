import { IsEmail, IsNotEmpty } from 'class-validator';

export class ValidateDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}
