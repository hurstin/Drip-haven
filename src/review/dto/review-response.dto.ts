import { ApiProperty } from '@nestjs/swagger';

export class ReviewResponseDto {
  @ApiProperty({
    description: 'Review ID',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'Rating from 1 to 5 stars',
    example: 5,
    type: 'integer',
  })
  rating: number;

  @ApiProperty({
    description: 'Review comment',
    example: 'Excellent service! Very professional and thorough.',
    type: 'string',
    required: false,
  })
  comment?: string;

  @ApiProperty({
    description: 'Date when the review was created',
    example: '2024-01-15T10:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the review was last updated',
    example: '2024-01-15T10:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'User who wrote the review',
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'John Doe' },
      email: { type: 'string', example: 'john@example.com' },
    },
  })
  user: {
    id: number;
    name: string;
    email: string;
  };

  @ApiProperty({
    description: 'Booking associated with the review',
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      scheduledTime: { type: 'string', format: 'date-time' },
      status: { type: 'string', example: 'completed' },
    },
  })
  booking: {
    id: number;
    scheduledTime: Date;
    status: string;
  };

  @ApiProperty({
    description: 'Washer who provided the service',
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      user: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 2 },
          name: { type: 'string', example: 'Jane Smith' },
        },
      },
    },
  })
  washer: {
    id: number;
    user: {
      id: number;
      name: string;
    };
  };
}
