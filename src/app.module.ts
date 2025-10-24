import { ProductsModule } from '@modules/products/products.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    ProductsModule,
  ],
})
export class AppModule {}
