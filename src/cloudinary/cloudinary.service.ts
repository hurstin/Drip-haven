// src/cloudinary/cloudinary.service.ts
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { cloudinaryConfig } from '../config/cloudinary.config';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config(cloudinaryConfig);
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'profile-pictures',
  ) {
    try {
      let result: UploadApiResponse;

      // Prefer disk path if provided (diskStorage). Otherwise use buffer (memoryStorage)
      if (file.path) {
        result = await cloudinary.uploader.upload(file.path, {
          folder,
          resource_type: 'auto',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
          ],
        });
      } else if (file.buffer) {
        result = await new Promise<UploadApiResponse>((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'auto',
              transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto' },
              ],
            },
            (error, res) => {
              if (error || !res) return reject(error);
              resolve(res);
            },
          );

          // Create a readable stream from the buffer and pipe to Cloudinary
          Readable.from(file.buffer).pipe(upload);
        });
      } else {
        throw new Error('No file data provided');
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  async deleteImage(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }
}
