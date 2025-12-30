import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../../entities/payment.entity';
import { MercadoPago } from '../../entities/mercado-pago.entity';
import { PaymentService, PaymentWithCheckoutUrl } from './payment.service';
import { MercadoPagoService } from '../../external/mercado-pago/mercado-pago.service';

const createMockRepo = <T>() =>
  ({
    create: jest.fn(),
    save: jest.fn(),
  }) as unknown as jest.Mocked<Repository<T>>;

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepo: jest.Mocked<Repository<Payment>>;
  let mpRepo: jest.Mocked<Repository<MercadoPago>>;
  let mpService: jest.Mocked<MercadoPagoService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useValue: createMockRepo<Payment>(),
        },
        {
          provide: getRepositoryToken(MercadoPago),
          useValue: createMockRepo<MercadoPago>(),
        },
        {
          provide: MercadoPagoService,
          useValue: {
            createPreference: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRepo = module.get(getRepositoryToken(Payment));
    mpRepo = module.get(getRepositoryToken(MercadoPago));
    mpService = module.get(
      MercadoPagoService,
    ) as jest.Mocked<MercadoPagoService>;
  });

  describe('create', () => {
    it('should create PIX payment without calling MercadoPagoService', async () => {
      const payment: Payment = {
        id: 'id-1',
        cpf: '22233344405',
        description: 'PIX payment',
        amount: 100,
        paymentMethod: PaymentMethod.PIX,
        status: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      paymentRepo.create.mockReturnValue(payment);
      paymentRepo.save.mockResolvedValue(payment);

      const result = await service.create(
        payment.cpf,
        payment.description,
        payment.amount,
        payment.paymentMethod,
      );

      expect(paymentRepo.create).toHaveBeenCalledWith({
        cpf: payment.cpf,
        description: payment.description,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: PaymentStatus.PENDING,
      });
      expect(paymentRepo.save).toHaveBeenCalledWith(payment);
      expect(mpService.createPreference).not.toHaveBeenCalled();
      expect((result as PaymentWithCheckoutUrl).checkoutUrl).toBeNull();
    });

    it('should create CREDIT_CARD payment and call MercadoPagoService', async () => {
      const payment: Payment = {
        id: 'id-2',
        cpf: '22233344405',
        description: 'Credit card payment',
        amount: 200,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      paymentRepo.create.mockReturnValue(payment);
      paymentRepo.save.mockResolvedValue(payment);

      mpService.createPreference.mockResolvedValue({
        preferenceId: 'pref-123',
        checkoutUrl: 'https://checkout.test',
        rawResponse: {},
      });

      mpRepo.save.mockResolvedValue({} as MercadoPago);

      const result = await service.create(
        payment.cpf,
        payment.description,
        payment.amount,
        payment.paymentMethod,
      );

      expect(mpService.createPreference).toHaveBeenCalledWith(
        payment.id,
        Number(payment.amount),
        payment.description,
        payment.cpf,
      );
      expect(mpRepo.save).toHaveBeenCalledWith({
        paymentId: payment.id,
        preferenceId: 'pref-123',
        checkoutUrl: 'https://checkout.test',
        status: 'pending',
        rawResponse: {},
      });
      expect(result.checkoutUrl).toBe('https://checkout.test');
    });
  });
});
