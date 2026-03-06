import { Module } from '@nestjs/common';
import { BrokersService } from './brokers.service';
import { KISService } from './markets/kis.service';
import { SSIService } from './markets/ssi.service';
import { MiraeAssetService } from './markets/mirae-asset.service';

@Module({
  providers: [BrokersService, KISService, SSIService, MiraeAssetService],
  exports: [BrokersService, KISService, SSIService, MiraeAssetService],
  
})
export class BrokersModule {}
