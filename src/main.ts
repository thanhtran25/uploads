import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Config } from './shared/config/env.config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(Config.SERVER_PORT);
}
bootstrap();
['VN30F2512','41I1G1000','41I1G3000','41I1G6000','41I2FC000','41I2G1000','41I2G3000','41I2G6000','GB05F2512','GB10F2512','41B5G3000','41BAG3000','41B5G6000','41BAG6000']