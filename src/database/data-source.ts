import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import { config } from 'dotenv';
import * as path from 'path';

config();

const options: DataSourceOptions & SeederOptions = {
  type: (process.env.DB_TYPE as any) || 'mariadb',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: (process.env.DB_DATABASE as string) || 'smartDiet',
  entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',

  // typeorm-extension seeding
  seeds: ['src/database/seeds/**/*{.ts,.js}'],
  factories: ['src/database/factories/**/*{.ts,.js}'],
};

export const dataSource = new DataSource(options);

export default options; 