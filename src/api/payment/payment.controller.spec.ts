import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService, PaymentWithCheckoutUrl } from './payment.service';
import { PaymentMethod, PaymentStatus } from '../../entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: jest.Mocked<PaymentService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get(PaymentService);
  });

  describe('create', () => {
    it('should delegate to PaymentService.create and return result', async () => {
      const dto: CreatePaymentDto = {
        cpf: '22233344405',
        description: 'Compra online',
        amount: 299.99,
        paymentMethod: PaymentMethod.CREDIT_CARD,
      };

      const payment: PaymentWithCheckoutUrl = {
        id: 'id-1',
        cpf: dto.cpf,
        description: dto.description,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        status: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        checkoutUrl: 'https://checkout.test',
      };

      service.create.mockResolvedValue(payment);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(
        dto.cpf,
        dto.description,
        dto.amount,
        dto.paymentMethod,
      );
      expect(result).toBe(payment);
    });
  });

  describe('findAll', () => {
    it('should delegate to PaymentService.findAll', async () => {
      const payments: PaymentWithCheckoutUrl[] = [];
      service.findAll.mockResolvedValue(payments);

      const result = await controller.findAll('22233344405', PaymentMethod.PIX);

      expect(service.findAll).toHaveBeenCalledWith({
        cpf: '22233344405',
        paymentMethod: PaymentMethod.PIX,
      });
      expect(result).toBe(payments);
    });
  });

  describe('findOne', () => {
    it('should delegate to PaymentService.findOne', async () => {
      const payment = {
        id: 'id-1',
      } as PaymentWithCheckoutUrl;
      service.findOne.mockResolvedValue(payment);

      const result = await controller.findOne('id-1');

      expect(service.findOne).toHaveBeenCalledWith('id-1');
      expect(result).toBe(payment);
    });
  });

  describe('update', () => {
    it('should delegate to PaymentService.update', async () => {
      const payment = {
        id: 'id-1',
      } as PaymentWithCheckoutUrl;
      service.update.mockResolvedValue(payment);

      const result = await controller.update('id-1', {
        status: PaymentStatus.PAID,
      });

      expect(service.update).toHaveBeenCalledWith('id-1', {
        status: PaymentStatus.PAID,
      });
      expect(result).toBe(payment);
    });
  });
});
