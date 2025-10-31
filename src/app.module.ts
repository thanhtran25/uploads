import { BrokersController } from '@modules/brokers/brokers.controller';
import { BrokersModule } from '@modules/brokers/brokers.module';
import { DownloadController } from '@modules/download/download.controller';
import { DownloadModule } from '@modules/download/download.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BrokersModule,
    DownloadModule
  ],
  controllers: [
    BrokersController,
    DownloadController
  ],
})
export class AppModule {}
