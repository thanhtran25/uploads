import { Product } from '@modules/products/entities/product.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Relation,
} from 'typeorm';

@Entity('categories')
export class Category {
  constructor(data: Partial<Category>) {
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @OneToMany(() => Product, (product) => product.category)
  products: Relation<Product>[];
}
