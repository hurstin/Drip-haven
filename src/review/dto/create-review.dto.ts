import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min, Length } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Rating from 1 to 5 stars',
    example: 5,
    minimum: 1,
    maximum: 5,
    type: 'integer',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Optional comment about the service',
    example: 'Excellent service! Very professional and thorough.',
    required: false,
    maxLength: 500,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  comment?: string;
}
