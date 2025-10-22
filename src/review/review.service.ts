import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { Booking } from '../booking/entities/booking.entity';
import { Washer } from '../washer/entities/washer.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Washer)
    private washerRepository: Repository<Washer>,
  ) {}

  async createReview(
    userId: number,
    bookingId: number,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    // Find the booking and validate it
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: [
        'user',
        'service',
        'service.washer',
        'service.washer.user',
        'review',
      ],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if the booking belongs to the user
    if (booking.user.id !== userId) {
      throw new BadRequestException('You can only review your own bookings');
    }

    // Check if booking is completed and paid
    if (booking.status !== 'paid' || booking.paymentStatus !== 'authorized') {
      throw new BadRequestException(
        'You can only review completed and paid bookings',
      );
    }

    // Check if review already exists for this booking
    if (booking.review) {
      throw new ConflictException('Review already exists for this booking');
    }

    if (!booking.service.washer) {
      throw new NotFoundException('Washer not found for this booking');
    }

    // Create the review
    const review = this.reviewRepository.create({
      user: { id: userId },
      booking: { id: bookingId },
      washer: { id: booking.service.washer.id },
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update washer's average rating and total reviews
    await this.updateWasherRating(booking.service.washer.id);

    // Return the review with relations
    return this.getReviewById(savedReview.id);
  }

  async getReviewById(reviewId: number): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user', 'booking', 'washer', 'washer.user'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user.id,
        name: review.user.name,
        email: review.user.email,
      },
      booking: {
        id: review.booking.id,
        scheduledTime: review.booking.scheduledTime,
        status: review.booking.status,
      },
      washer: {
        id: review.washer.id,
        user: {
          id: review.washer.user.id,
          name: review.washer.user.name,
        },
      },
    };
  }

  async getReviewsByWasher(washerId: number): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewRepository.find({
      where: { washer: { id: washerId } },
      relations: ['user', 'booking', 'washer', 'washer.user'],
      order: { createdAt: 'DESC' },
    });

    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user.id,
        name: review.user.name,
        email: review.user.email,
      },
      booking: {
        id: review.booking.id,
        scheduledTime: review.booking.scheduledTime,
        status: review.booking.status,
      },
      washer: {
        id: review.washer.id,
        user: {
          id: review.washer.user.id,
          name: review.washer.user.name,
        },
      },
    }));
  }

  async getReviewsByUser(userId: number): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'booking', 'washer', 'washer.user'],
      order: { createdAt: 'DESC' },
    });

    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user.id,
        name: review.user.name,
        email: review.user.email,
      },
      booking: {
        id: review.booking.id,
        scheduledTime: review.booking.scheduledTime,
        status: review.booking.status,
      },
      washer: {
        id: review.washer.id,
        user: {
          id: review.washer.user.id,
          name: review.washer.user.name,
        },
      },
    }));
  }

  async updateReview(
    reviewId: number,
    userId: number,
    updateData: Partial<CreateReviewDto>,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['washer'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.id !== userId) {
      throw new BadRequestException('You can only update your own reviews');
    }

    // Update review fields
    if (updateData.rating !== undefined) {
      review.rating = updateData.rating;
    }
    if (updateData.comment !== undefined) {
      review.comment = updateData.comment;
    }

    await this.reviewRepository.save(review);

    // Update washer's average rating
    await this.updateWasherRating(review.washer.id);

    return this.getReviewById(reviewId);
  }

  async deleteReview(reviewId: number, userId: number): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['washer'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.id !== userId) {
      throw new BadRequestException('You can only delete your own reviews');
    }

    const washerId = review.washer.id;
    await this.reviewRepository.remove(review);

    // Update washer's average rating after deletion
    await this.updateWasherRating(washerId);
  }

  private async updateWasherRating(washerId: number): Promise<void> {
    const washer = await this.washerRepository.findOne({
      where: { id: washerId },
    });

    if (!washer) {
      throw new NotFoundException('Washer not found');
    }

    // Get all reviews for this washer
    const reviews = await this.reviewRepository.find({
      where: { washer: { id: washerId } },
    });

    if (reviews.length === 0) {
      washer.averageRating = 0;
      washer.totalReviews = 0;
    } else {
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );
      washer.averageRating = Number((totalRating / reviews.length).toFixed(2));
      washer.totalReviews = reviews.length;
    }

    await this.washerRepository.save(washer);
  }

  async canUserReviewBooking(
    userId: number,
    bookingId: number,
  ): Promise<boolean> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'review'],
    });

    if (!booking) {
      return false;
    }

    // Check if booking belongs to user
    if (booking.user.id !== userId) {
      return false;
    }

    // Check if booking is completed and paid
    if (
      booking.status !== 'completed' ||
      booking.paymentStatus !== 'authorized'
    ) {
      return false;
    }

    // Check if review already exists
    if (booking.review) {
      return false;
    }

    return true;
  }
}
