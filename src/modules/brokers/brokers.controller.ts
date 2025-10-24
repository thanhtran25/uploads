import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BrokersService } from './brokers.service';

@Controller('compare')
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  @Get()
  findAll() {
    return this.brokersService.findAll();
  }
}
