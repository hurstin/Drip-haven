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
