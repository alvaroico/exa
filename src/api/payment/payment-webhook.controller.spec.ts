import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { of } from 'rxjs';
import { PaymentWebhookController } from './payment-webhook.controller';
import { PaymentService } from './payment.service';
import { PaymentStatus } from '../../entities/payment.entity';
import { HttpService } from '@nestjs/axios';

describe('PaymentWebhookController', () => {
  let controller: PaymentWebhookController;
  let paymentService: jest.Mocked<PaymentService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [PaymentWebhookController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentWebhookController>(PaymentWebhookController);
    paymentService = module.get(PaymentService);
    httpService = module.get(HttpService);
  });

  it('should process full payment webhook and update payment to PAID when approved', async () => {
    const webhookBody = {
      action: 'payment.created',
      api_version: 'v1',
      data: { id: '139373061871' },
      id: 'test',
      live_mode: true,
      type: 'payment',
      user_id: 'user',
      date_created: '2025-12-30T13:53:59Z',
    };

    jest.spyOn(httpService, 'get').mockReturnValue(
      of({
        data: {
          id: 139373061871,
          status: 'approved',
          external_reference: 'payment-123',
        },
      } as any),
    );

    const result = await controller.handleWebhook(
      webhookBody,
      undefined,
      undefined,
    );

    expect(paymentService.update).toHaveBeenCalledWith('payment-123', {
      status: PaymentStatus.PAID,
    });
    expect(result.message).toContain('atualizado para PAID');
  });

  it('should handle simple payment webhook via query params', async () => {
    jest.spyOn(httpService, 'get').mockReturnValue(
      of({
        data: {
          id: 139373061871,
          status: 'rejected',
          external_reference: 'payment-456',
        },
      } as any),
    );

    const result = await controller.handleWebhook(
      { resource: '139373061871', topic: 'payment' } as any,
      '139373061871',
      'payment',
    );

    expect(paymentService.update).toHaveBeenCalledWith('payment-456', {
      status: PaymentStatus.FAIL,
    });
    expect(result.message).toContain('atualizado para FAIL');
  });

  it('should ignore merchant_order webhooks except for logging', async () => {
    const result = await controller.handleWebhook(
      {
        resource: 'https://api.mercadolibre.com/merchant_orders/36846222105',
        topic: 'merchant_order',
      } as any,
      '36846222105',
      'merchant_order',
    );

    expect(paymentService.update).not.toHaveBeenCalled();
    expect(result.message).toBe('Merchant order notificado');
  });
});
