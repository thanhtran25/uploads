import { Product } from '@modules/products/entities/product.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventories')
export class Inventory {
  constructor(data: Partial<Inventory>) {
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  receiptCode: string;

  @Column()
  color: string;

  @Column()
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Product, (product) => product.inventories)
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @Column()
  productId: number;
}
