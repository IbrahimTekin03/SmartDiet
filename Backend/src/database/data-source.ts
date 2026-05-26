import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import type { SeederOptions } from 'typeorm-extension';
import { config } from 'dotenv';

config();

const options: DataSourceOptions & SeederOptions = {
  type: 'postgres' as any,
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '21482620',
  database: 'smartDiet',

  synchronize: true,
  entities: ['src/**/*.entity.{ts,js}'],
  seeds: ['src/database/seeds/**/*.{ts,js}'],
  factories: ['src/database/factories/**/*.{ts,js}'],
};

export const dataSource = new DataSource(options);
export default options;
