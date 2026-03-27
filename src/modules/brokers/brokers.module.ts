import { Module } from '@nestjs/common';
import { DownloadModule } from '@modules/download/download.module';
import { BrokersService } from './brokers.service';
import { KISService } from './markets/kis.service';
import { SSIService } from './markets/ssi.service';
import { MiraeAssetService } from './markets/mirae-asset.service';

@Module({
  imports: [DownloadModule],
  providers: [BrokersService, KISService, SSIService, MiraeAssetService],
  exports: [BrokersService],
})
export class BrokersModule {}
