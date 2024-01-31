import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { InventoriesModule } from './modules/inventories/inventories.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [UsersModule, InventoriesModule, ProductsModule],
})
export class AppModule {}
