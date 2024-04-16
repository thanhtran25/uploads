import dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import path from 'path';
import { Config } from '../config/env.config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: Config.DB_HOST,
  port: Config.DB_PORT,
  username: Config.DB_USER,
  password: Config.DB_PASSWORD,
  database: Config.DB_NAME,
  entities: [
    path.join(__dirname, '../..', 'modules/**/entities/*.entity{.js,.ts}'),
  ],
  migrations: [path.join(__dirname, '..', 'database/migrations/*{.js,.ts}')],
  namingStrategy: new SnakeNamingStrategy(),
  logging: Config.LOGGING === 'true' ? true : false,
});
