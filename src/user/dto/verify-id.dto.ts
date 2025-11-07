import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyIdDto {
  @ApiPropertyOptional({
    description: 'National Identification Number (NIN)',
    example: '12345678901',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  nin?: string;
}
