import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
} from '../../entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
  ) {}

  async create(
    cpf: string,
    description: string,
    amount: number,
    paymentMethod: PaymentMethod,
  ): Promise<Payment> {
    const payment = this.paymentsRepository.create({
      cpf,
      description,
      amount,
      paymentMethod,
      status: PaymentStatus.PENDING,
    });
    return this.paymentsRepository.save(payment);
  }

  async findAll(filters?: {
    cpf?: string;
    paymentMethod?: PaymentMethod;
  }): Promise<Payment[]> {
    const query = this.paymentsRepository.createQueryBuilder('payment');

    if (filters?.cpf) {
      query.andWhere('payment.cpf = :cpf', { cpf: filters.cpf });
    }

    if (filters?.paymentMethod) {
      query.andWhere('payment.paymentMethod = :paymentMethod', {
        paymentMethod: filters.paymentMethod,
      });
    }

    return query.orderBy('payment.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException(`Pagamento com ID ${id} não foi localizado`);
    }
    return payment;
  }

  async update(id: string, updateData: Partial<Payment>): Promise<Payment> {
    // Verifica se o pagamento existe
    const payment = await this.paymentsRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException(`Pagamento com ID ${id} não foi localizado`);
    }
    await this.paymentsRepository.update(id, updateData);
    return this.findOne(id);
  }
}
