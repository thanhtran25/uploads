import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Config } from './shared/config/env.config';
import { AppDataSource } from '@shared/connections/database';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await AppDataSource.initialize();
  await app.listen(Config.SERVER_PORT);
}
bootstrap();
