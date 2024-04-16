import { IsEmail, IsEnum, IsString, Validate } from 'class-validator';
import { ROLES } from '@shared/utils/enums/users.enum';
import { User } from '../entities/user.entity';
import { Unique } from '@shared/validator/unique';

export class CreateUserDto {
  @IsEmail()
  @Validate(Unique, [User])
  email: string;

  @IsString()
  password: string;

  @IsString()
  fullName: string;

  @IsEnum(ROLES)
  role: ROLES;
}
