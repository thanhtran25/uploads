import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
  OneToMany,
} from 'typeorm';
import { Category } from '@modules/categories/entities/category.entity';
import { Inventory } from '@modules/inventories/entities/inventory.entity';

@Entity('products')
export class Product {
  constructor(data: Partial<Product>) {
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @Column({
    length: 255,
  })
  name: string;

  @Column()
  price: number;

  @Column()
  images: string;

  @Column()
  description: string;

  @Column()
  origin: string;

  @Column()
  warrantyPeriod: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ default: null })
  deletedAt: Date;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category: Relation<Category>;
  @Column()
  categoryId: number;

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventories: Relation<Inventory>[];
}
