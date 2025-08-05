import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable() // Marks this class as a provider that can be injected into other classes
export class LocalStrategy extends PassportStrategy(Strategy) {
  //      /**
  //    * Strategy Configuration:
  //    * @param authService - Injected instance of AuthService for user validation
  //    */
  constructor(private authService: AuthService) {
    // Configure Passport to use 'email' instead of default 'username'

    super({ usernameField: 'email' });
  }

  //       /**
  //    * Validation Method - Passport's authentication hook
  //    * @param email - User's email (passed as first parameter)
  //    * @param password - User's password (passed as second parameter)
  //    * @returns Authenticated user object
  //    * @throws UnauthorizedException for invalid credentials
  //    */

  async validate(email: string, password: string): Promise<any> {
    // Delegate authentication to authService

    const user = await this.authService.validateUser({ email, password });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
