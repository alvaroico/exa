import { Injectable } from '@nestjs/common';
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

  async findOne(id: string): Promise<Payment | null> {
    return this.paymentsRepository.findOne({ where: { id } });
  }

  async update(
    id: string,
    updateData: Partial<Payment>,
  ): Promise<Payment | null> {
    await this.paymentsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.paymentsRepository.delete(id);
  }
}
