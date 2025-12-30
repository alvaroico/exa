import { DataSource, DataSourceOptions } from 'typeorm';
import { typeOrmConfig } from './database/config';

export const AppDataSource = new DataSource(typeOrmConfig as DataSourceOptions);
