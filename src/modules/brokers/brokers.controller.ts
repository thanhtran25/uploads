import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BrokersService } from './brokers.service';
import { postfromAPI } from '@shared/utils/data.util';

@Controller('compare')
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  @Get()
  findAll() {
    return this.brokersService.findAll();
  }
    
  @Post("/test")
  test(@Body() body: any) {
    console.log(body);
    
    return postfromAPI('http://localhost:9001/phone/confirmOtp', body.otp);
  }
}
