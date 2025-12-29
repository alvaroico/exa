import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface HealthCheckResponse {
  status: 'UP' | 'DOWN';
  database: string;
  timestamp: string;
  responseTime: string;
}

@Injectable()
export class AppService {
  constructor(private dataSource: DataSource) {}

  getHello(): string {
    return 'API de Cobranças';
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    const startTime = Date.now();

    try {
      // Tenta executar uma query simples no banco
      await this.dataSource.query('SELECT 1');

      const endTime = Date.now();
      const responseTime = `${endTime - startTime}ms`;

      return {
        status: 'UP',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString(),
        responseTime,
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTime = `${endTime - startTime}ms`;

      return {
        status: 'DOWN',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString(),
        responseTime,
      };
    }
  }
}
