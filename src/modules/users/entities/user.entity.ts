import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ROLES } from '@shared/utils/enums/users.enum';

@Entity('users')
export class User {
  constructor(data: Partial<User>) {
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  hashedPassword: string;

  @Column()
  fullName: string;

  @Column({ type: 'enum', enum: ROLES, default: ROLES.CUSTOMER })
  role: ROLES;
}
