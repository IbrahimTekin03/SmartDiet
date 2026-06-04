import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import type { SeederOptions } from 'typeorm-extension';
import { config } from 'dotenv';

config();

const options: DataSourceOptions & SeederOptions = {
  type: 'postgres' as any,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '21482620',
  database: process.env.DB_DATABASE || 'smartDiet',

  synchronize: true,
  entities: ['src/**/*.entity.{ts,js}'],
  seeds: ['src/database/seeds/**/*.{ts,js}'],
  factories: ['src/database/factories/**/*.{ts,js}'],
};

export const dataSource = new DataSource(options);
export default options;
