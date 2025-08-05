import { IsString } from 'class-validator';

export class CreateCarDto {
  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsString()
  color: string;

  @IsString()
  plateNumber: string;
}
