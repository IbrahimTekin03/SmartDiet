import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';

const server = express();
let appInstance: any = null;

export const bootstrap = async () => {
  if (appInstance) {
    return server;
  }

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
  );

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
  app.enableCors();
  
  // Note: Local uploads will be read-only on Vercel, but static serving is kept for compatibility
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Swagger (Optional, but enabled for convenience)
  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get('APP_NAME', 'NestJS Base Backend'))
    .setDescription(configService.get('APP_DESCRIPTION', 'NestJS Base Backend API'))
    .setVersion(configService.get('APP_VERSION', '1.0.0'))
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  await app.init();
  appInstance = app;
  return server;
};

export default async (req: any, res: any) => {
  await bootstrap();
  server(req, res);
};
