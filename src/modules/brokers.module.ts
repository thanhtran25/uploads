import { Module } from '@nestjs/common';
import { DownloadModule } from './download.module';
import { BrokersController } from '@controllers/brokers.controller';
import { BrokersService } from '@services/brokers.service';
import { KISService } from '@services/kis.service';
import { SSIService } from '@services/ssi.service';
import { MiraeAssetService } from '@services/mirae-asset.service';

@Module({
  imports: [DownloadModule],
  controllers: [BrokersController],
  providers: [BrokersService, KISService, SSIService, MiraeAssetService],
  exports: [BrokersService],
})
export class BrokersModule {}
