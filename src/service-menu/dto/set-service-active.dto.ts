import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetServiceActiveDto {
  @ApiProperty({ description: 'Whether the service is active', example: true })
  @IsBoolean()
  isActive: boolean;
}
