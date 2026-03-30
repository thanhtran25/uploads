import { BrokersModule } from '@modules/brokers.module';
import { DownloadModule } from '@modules/download.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BrokersModule,
    DownloadModule,
  ],
})
export class AppModule {}
