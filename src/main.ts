// Application bootstrap entrypoint: creates Nest app and configures Swagger
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: HTTP headers hardening
  app.use(helmet());

  // CORS: allow frontend to connect
  // Set CORS_ORIGIN env var to a comma-separated list for explicit origins, e.g.:
  // CORS_ORIGIN=http://localhost:5173,https://your-frontend.app
  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Accept, X-Requested-With',
  });

  // API versioning: use URI strategy, e.g., /v1/... endpoints
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Swagger document configuration
  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Drip Haven')
    .setDescription('The Drip Haven API description')
    .setVersion('1.0')
    .addTag('Drip Haven')
    .build();
  // Expose Swagger UI at /api
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // Start HTTP server
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
