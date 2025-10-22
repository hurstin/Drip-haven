import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';

@ApiTags('Reviews')
@ApiBearerAuth()
@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('booking/:bookingId')
  @ApiOperation({
    summary: 'Create a review for a completed booking',
    description:
      'Users can create reviews for their completed and paid bookings.',
  })
  @ApiParam({
    name: 'bookingId',
    description: 'ID of the booking to review',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid booking or already reviewed',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Review already exists for this booking',
  })
  @Roles('user')
  async createReview(
    @Param('bookingId') bookingId: string,
    @Body() createReviewDto: CreateReviewDto,
    @Req() req: any,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.createReview(
      req.user.userId,
      +bookingId,
      createReviewDto,
    );
  }

  @Get('booking/:bookingId/can-review')
  @ApiOperation({
    summary: 'Check if user can review a booking',
    description:
      'Check if the current user can create a review for the specified booking.',
  })
  @ApiParam({
    name: 'bookingId',
    description: 'ID of the booking to check',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns whether user can review the booking',
    schema: {
      example: {
        canReview: true,
        reason: 'Booking is completed and paid, no review exists yet',
      },
    },
  })
  @Roles('user')
  async canReviewBooking(
    @Param('bookingId') bookingId: string,
    @Req() req: any,
  ): Promise<{ canReview: boolean; reason?: string }> {
    const canReview = await this.reviewService.canUserReviewBooking(
      req.user.userId,
      +bookingId,
    );

    return {
      canReview,
      reason: canReview
        ? 'You can review this booking'
        : 'You cannot review this booking (may be incomplete, unpaid, or already reviewed)',
    };
  }

  @Get('washer/:washerId')
  @ApiOperation({
    summary: 'Get all reviews for a washer',
    description: 'Retrieve all reviews for a specific washer.',
  })
  @ApiParam({
    name: 'washerId',
    description: 'ID of the washer',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'List of reviews for the washer',
    type: [ReviewResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Washer not found',
  })
  @Roles('user', 'washer', 'admin')
  async getReviewsByWasher(
    @Param('washerId') washerId: string,
  ): Promise<ReviewResponseDto[]> {
    return this.reviewService.getReviewsByWasher(+washerId);
  }

  @Get('my-reviews')
  @ApiOperation({
    summary: 'Get current user reviews',
    description: 'Retrieve all reviews created by the current user.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user reviews',
    type: [ReviewResponseDto],
  })
  @Roles('user')
  async getMyReviews(@Req() req: any): Promise<ReviewResponseDto[]> {
    return this.reviewService.getReviewsByUser(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific review',
    description: 'Retrieve a specific review by ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Review details',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  @Roles('user', 'washer', 'admin')
  async getReview(@Param('id') id: string): Promise<ReviewResponseDto> {
    return this.reviewService.getReviewById(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a review',
    description:
      'Update an existing review. Only the review author can update their review.',
  })
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Review updated successfully',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Cannot update this review',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  @Roles('user')
  async updateReview(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateReviewDto>,
    @Req() req: any,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.updateReview(+id, req.user.userId, updateData);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a review',
    description:
      'Delete an existing review. Only the review author can delete their review.',
  })
  @ApiParam({
    name: 'id',
    description: 'Review ID',
    example: 1,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Review deleted successfully',
    schema: {
      example: {
        message: 'Review deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Cannot delete this review',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found',
  })
  @Roles('user')
  async deleteReview(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<{ message: string }> {
    await this.reviewService.deleteReview(+id, req.user.userId);
    return { message: 'Review deleted successfully' };
  }
}
