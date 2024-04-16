import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Config } from './shared/config/env.config';
import { AppDataSource } from '@shared/connections/database';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await AppDataSource.initialize();
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(Config.SERVER_PORT);
}
bootstrap();
