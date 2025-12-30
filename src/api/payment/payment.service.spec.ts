import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../../entities/payment.entity';
import { MercadoPago } from '../../entities/mercado-pago.entity';
import { PaymentService } from './payment.service';
import { MercadoPagoService } from '../../external/mercado-pago/mercado-pago.service';

const createMockRepo = <T>() => ({
  create: jest.fn<(Partial<T> & { id?: string }) | T, [Partial<T>]>(),
  save: jest.fn<Promise<T>, [T]>(),
});

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepo: jest.Mocked<ReturnType<typeof createMockRepo<Payment>>>;
  let mpRepo: jest.Mocked<ReturnType<typeof createMockRepo<MercadoPago>>>;
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
    paymentRepo = module.get<
      jest.Mocked<ReturnType<typeof createMockRepo<Payment>>>
    >(getRepositoryToken(Payment));
    mpRepo = module.get<
      jest.Mocked<ReturnType<typeof createMockRepo<MercadoPago>>>
    >(getRepositoryToken(MercadoPago));
    mpService = module.get<jest.Mocked<MercadoPagoService>>(MercadoPagoService);
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

      // usar spy para evitar unbound-method
      const createPreferenceSpy = jest.spyOn(mpService, 'createPreference');
      expect(createPreferenceSpy).not.toHaveBeenCalled();

      expect(result.checkoutUrl).toBeNull();
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

      const createPreferenceSpy = jest.spyOn(mpService, 'createPreference');

      expect(createPreferenceSpy).toHaveBeenCalledWith(
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
        transactionId: 'pref-123',
        rawResponse: {},
      });
      expect(result.checkoutUrl).toBe('https://checkout.test');
    });
  });
});
