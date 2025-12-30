import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';

interface HealthCheckResponse {
  status: 'UP' | 'DOWN';
  database: string;
  timestamp: string;
  responseTime: string;
}

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockDataSource = {
      query: jest.fn().mockResolvedValue([]),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('healthCheck', () => {
    it('should return health check with UP status', async () => {
      const result = (await appController.healthCheck()) as HealthCheckResponse;
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('responseTime');
      expect(result.status).toBe('UP');
      expect(result.database).toBe('PostgreSQL');
    });
  });
});
