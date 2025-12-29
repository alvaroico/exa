import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  @ApiOperation({ summary: 'Health check - Database connection' })
  @ApiResponse({
    status: 200,
    description: 'Database connection status',
    schema: {
      example: {
        status: 'UP',
        database: 'PostgreSQL',
        timestamp: '2024-12-29T20:30:00.000Z',
        responseTime: '5ms',
      },
    },
  })
  async healthCheck(): Promise<any> {
    return this.appService.healthCheck();
  }
}
