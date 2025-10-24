import { Module } from '@nestjs/common';
import { BrokersService } from './brokers.service';
import { BrokersController } from './brokers.controller';
import { KISService } from './markets/kis.service';
import { SSIService } from './markets/ssi.service';
import { VPSService } from './markets/vps.service';
import { MiraeAssetService } from './markets/mirae-asset.service';

@Module({
  controllers: [BrokersController],
  providers: [BrokersService, KISService, SSIService, VPSService, MiraeAssetService],
})
export class BrokersModule {}
