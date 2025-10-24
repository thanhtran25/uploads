import { BrokersModule } from '@modules/brokers/brokers.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BrokersModule,
  ],
})
export class AppModule {}
