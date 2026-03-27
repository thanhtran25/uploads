import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Config } from './shared/config/env.config';
import { ValidationPipe } from '@nestjs/common';

try { process.loadEnvFile?.(); } catch (_) {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(Config.SERVER_PORT);
}
bootstrap();
