import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS
  const frontendUrl = configService.get('FRONTEND_URL', 'http://localhost:5173');
  app.enableCors({
    origin: configService.get('NODE_ENV') === 'production'
      ? [frontendUrl]
      : true,
    credentials: true,
  });

  // Static uploads directory
  const uploadsPath = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));

  // Swagger (development only)
  if (configService.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(configService.get('APP_NAME', 'SmartDiet API'))
      .setDescription(configService.get('APP_DESCRIPTION', 'SmartDiet Backend API Documentation'))
      .setVersion(configService.get('APP_VERSION', '1.0.0'))
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
    console.log(`Swagger documentation is available at: http://localhost:${configService.get('PORT', 3000)}/${apiPrefix}/docs`);
  }

  // Start server
  const port = configService.get('PORT', 3000);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
