# Drip Haven Monolith (NestJS Backend)

A comprehensive car wash management system backend built with [NestJS](https://nestjs.com/), designed as a monolithic application. This project provides a complete API for managing car wash services, users, vehicles, and washers.

## 🚀 Features

### Core Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user CRUD operations with profile management
- **Car Management**: Vehicle registration and management system
- **Washer Management**: Staff/employee management for car wash operations
- **Service Menu**: Configurable service offerings and pricing
- **Email Integration**: Password reset and notification system via email
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation

### Technical Features

- Built with TypeScript and NestJS
- PostgreSQL database with TypeORM
- JWT authentication with Passport.js
- Email functionality with Nodemailer
- Input validation with class-validator
- Global validation pipes and interceptors
- Docker support for database
- Comprehensive testing setup

## 🏗️ Project Structure

```
src/
├── auth/           # Authentication & authorization
├── user/           # User management
├── car/            # Vehicle management
├── washer/         # Staff/employee management
├── service-menu/   # Service offerings
├── interceptors/   # Response serialization
└── utils/          # Utility functions
```

## 🛠️ Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Docker (optional, for database)

## 📦 Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd drip-haven
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Database
   DB_HOST
   DB_PORT
   DB_USERNAME
   DB_PASSWORD
   DB_DATABASE

   # JWT
   JWT_SECRET
   JWT_EXPIRES_IN

   # Email (for password reset)
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USERNAME=your-email@example.com
   EMAIL_PASSWORD=your-email-password

   # Server
   PORT=3000
   ```

4. **Set up the database:**

   **Option A: Using Docker (Recommended)**

   ```bash
   docker-compose up -d
   ```

   **Option B: Local PostgreSQL**
   - Install PostgreSQL
   - Create a database named `dripHaven`
   - Update the `.env` file with your database credentials

## 🚀 Running the Application

### Development Mode

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

## 📚 API Documentation

Once the application is running, you can access the interactive API documentation at:

```
http://localhost:3000/api
```

The documentation includes:

- All available endpoints
- Request/response schemas
- Authentication requirements
- Interactive testing interface

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

### Watch Mode

```bash
npm run test:watch
```

## 🔧 Available Scripts

- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

## 🗄️ Database

The application uses PostgreSQL as the primary database. The database schema is automatically synchronized when the application starts (in development mode).

### Key Entities

- **Users**: Customer accounts and profiles
- **Cars**: Vehicle information linked to users
- **Washers**: Staff/employee information
- **ServiceMenu**: Available car wash services and pricing
- **Auth**: Authentication-related data

## 🔐 Authentication

The application implements JWT-based authentication with the following features:

- **Registration**: User account creation
- **Login**: JWT token generation
- **Password Reset**: Email-based password recovery
- **Role-based Access**: Different permission levels for users
- **Guards**: Route protection and authorization

## 📧 Email Integration

The application includes email functionality for:

- Password reset requests
- Account notifications
- Service confirmations

Configure your email settings in the `.env` file to enable email features.

## 🐳 Docker Support

A `docker-compose.yml` file is provided for easy database setup:

```bash
# Start PostgreSQL database
docker-compose up -d

# Stop the database
docker-compose down
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions, issues, or contributions, please:

- Open an issue on GitHub
- Check the API documentation at `/api`
- Review the project structure and existing code

---

**Note:** This project is actively maintained and may receive updates. Please check the latest documentation for the most current information.
