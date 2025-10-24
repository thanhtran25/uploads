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
}
