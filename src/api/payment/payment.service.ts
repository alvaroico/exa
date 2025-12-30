import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
} from '../../entities/payment.entity';
import { MercadoPago } from '../../entities/mercado-pago.entity';
import { MercadoPagoService } from '../../external/mercado-pago/mercado-pago.service';

export interface PaymentWithCheckoutUrl extends Payment {
  checkoutUrl?: string | null;
}

interface PaymentWithCheckoutUrlRow {
  payment_id: string;
  payment_cpf: string;
  payment_description: string;
  payment_amount: string | number;
  payment_paymentMethod: PaymentMethod;
  payment_status: PaymentStatus;
  payment_createdAt: Date;
  payment_updatedAt: Date;
  mp_checkoutUrl: string | null;
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(MercadoPago)
    private mercadoPagoRepository: Repository<MercadoPago>,
    private mercadoPagoService: MercadoPagoService,
  ) {}

  async create(
    cpf: string,
    description: string,
    amount: number,
    paymentMethod: PaymentMethod,
  ): Promise<PaymentWithCheckoutUrl> {
    const payment = this.paymentsRepository.create({
      cpf,
      description,
      amount,
      paymentMethod,
      status: PaymentStatus.PENDING,
    });
    const savedPayment = await this.paymentsRepository.save(payment);

    let checkoutUrl: string | null = null;

    // Se o método de pagamento for CREDIT_CARD, criar preferência no Mercado Pago
    if (paymentMethod === PaymentMethod.CREDIT_CARD) {
      try {
        const mercadoPagoResult =
          await this.mercadoPagoService.createPreference(
            savedPayment.id,
            Number(savedPayment.amount),
            description,
            cpf,
          );

        checkoutUrl = mercadoPagoResult.checkoutUrl;

        await this.mercadoPagoRepository.save({
          paymentId: savedPayment.id,
          preferenceId: mercadoPagoResult.preferenceId,
          checkoutUrl: mercadoPagoResult.checkoutUrl,
          status: 'pending',
          transactionId: mercadoPagoResult.preferenceId,
          rawResponse: mercadoPagoResult.rawResponse,
        });
      } catch (error) {
        console.error('Erro ao criar preferência no Mercado Pago:', error);
      }
    }

    return { ...savedPayment, checkoutUrl };
  }

  async findAll(filters?: {
    cpf?: string;
    paymentMethod?: PaymentMethod;
  }): Promise<PaymentWithCheckoutUrl[]> {
    const query = this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoin('mercado_pago', 'mp', 'mp.paymentId = payment.id');

    if (filters?.cpf) {
      query.andWhere('payment.cpf = :cpf', { cpf: filters.cpf });
    }

    if (filters?.paymentMethod) {
      query.andWhere('payment.paymentMethod = :paymentMethod', {
        paymentMethod: filters.paymentMethod,
      });
    }

    const rows: PaymentWithCheckoutUrlRow[] = await query
      .orderBy('payment.createdAt', 'DESC')
      .select([
        'payment.id AS payment_id',
        'payment.cpf AS payment_cpf',
        'payment.description AS payment_description',
        'payment.amount AS payment_amount',
        'payment.paymentMethod AS payment_paymentMethod',
        'payment.status AS payment_status',
        'payment.createdAt AS payment_createdAt',
        'payment.updatedAt AS payment_updatedAt',
        'mp.checkoutUrl AS mp_checkoutUrl',
      ])
      .getRawMany();

    return rows.map((row) => ({
      id: row.payment_id,
      cpf: row.payment_cpf,
      description: row.payment_description,
      amount: Number(row.payment_amount),
      paymentMethod: row.payment_paymentMethod,
      status: row.payment_status,
      createdAt: row.payment_createdAt,
      updatedAt: row.payment_updatedAt,
      checkoutUrl: row.mp_checkoutUrl ?? null,
    }));
  }

  async findOne(id: string): Promise<PaymentWithCheckoutUrl> {
    const row = (await this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoin('mercado_pago', 'mp', 'mp.paymentId = payment.id')
      .where('payment.id = :id', { id })
      .select([
        'payment.id AS payment_id',
        'payment.cpf AS payment_cpf',
        'payment.description AS payment_description',
        'payment.amount AS payment_amount',
        'payment.paymentMethod AS payment_paymentMethod',
        'payment.status AS payment_status',
        'payment.createdAt AS payment_createdAt',
        'payment.updatedAt AS payment_updatedAt',
        'mp.checkoutUrl AS mp_checkoutUrl',
      ])
      .getRawOne()) as PaymentWithCheckoutUrlRow | null;

    if (!row) {
      throw new NotFoundException(`Pagamento com ID ${id} não foi localizado`);
    }

    return {
      id: row.payment_id,
      cpf: row.payment_cpf,
      description: row.payment_description,
      amount: Number(row.payment_amount),
      paymentMethod: row.payment_paymentMethod,
      status: row.payment_status,
      createdAt: row.payment_createdAt,
      updatedAt: row.payment_updatedAt,
      checkoutUrl: row.mp_checkoutUrl ?? null,
    };
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
