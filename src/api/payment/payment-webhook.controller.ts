import {
  Controller,
  Post,
  Body,
  HttpCode,
  Logger,
  Query,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentStatus } from '../../entities/payment.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError } from 'axios';

// Webhook completo de pagamento do Mercado Pago
interface MercadoPagoPaymentWebhook {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  id: string;
  live_mode: boolean;
  type: string; // "payment"
  user_id: string | number;
  date_created: string;
}

// Resposta da API de detalhes do pagamento
interface MercadoPagoPaymentDetails {
  id: number;
  status: string;
  external_reference: string;
}

@Controller('api/payment')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);
  private readonly accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  constructor(
    private readonly paymentService: PaymentService,
    private readonly httpService: HttpService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Body() body: unknown,
    @Query('id') paymentId?: string,
    @Query('topic') topic?: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Webhook recebido - body: ${JSON.stringify(body)}`);
    this.logger.log(`Query params - id: ${paymentId}, topic: ${topic}`);

    // Trata webhook completo de pagamento
    if (this._isPaymentWebhook(body)) {
      return this._handlePaymentWebhook(body);
    }

    // Trata webhook simples (com query params)
    if (topic === 'payment' && paymentId) {
      return this._handleSimplePaymentWebhook(paymentId);
    }

    if (topic === 'merchant_order' && paymentId) {
      return this._handleMerchantOrderWebhook(paymentId);
    }

    return { message: 'Webhook processado' };
  }

  private _isPaymentWebhook(body: unknown): body is MercadoPagoPaymentWebhook {
    if (typeof body !== 'object' || body === null) {
      return false;
    }

    const obj = body as { type?: unknown; data?: unknown };
    const data = obj.data as { id?: unknown } | undefined;

    return (
      obj.type === 'payment' &&
      typeof data === 'object' &&
      data !== null &&
      typeof data.id === 'string'
    );
  }

  private async _handlePaymentWebhook(
    webhook: MercadoPagoPaymentWebhook,
  ): Promise<{ message: string }> {
    try {
      const mercadoPagoPaymentId = webhook.data.id;

      this.logger.log(
        `Processando webhook de pagamento: ${mercadoPagoPaymentId}`,
      );

      // Buscar detalhes do pagamento no Mercado Pago
      const paymentDetails =
        await this._getMercadoPagoPaymentDetails(mercadoPagoPaymentId);

      if (!paymentDetails || !paymentDetails.external_reference) {
        this.logger.warn(
          `Pagamento ${mercadoPagoPaymentId} sem external_reference`,
        );
        return { message: 'Pagamento sem referência externa' };
      }

      const paymentIdFromMP = paymentDetails.external_reference;
      const newStatus =
        paymentDetails.status === 'approved'
          ? PaymentStatus.PAID
          : paymentDetails.status === 'rejected'
            ? PaymentStatus.FAIL
            : PaymentStatus.PENDING;

      this.logger.log(
        `Atualizando pagamento ${paymentIdFromMP} para status: ${newStatus}`,
      );

      await this.paymentService.update(paymentIdFromMP, { status: newStatus });

      return {
        message: `Pagamento ${paymentIdFromMP} atualizado para ${newStatus}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao processar webhook de pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return { message: 'Erro ao processar webhook' };
    }
  }

  private async _handleSimplePaymentWebhook(
    mercadoPagoPaymentId: string,
  ): Promise<{ message: string }> {
    try {
      this.logger.log(
        `Processando webhook simples de pagamento: ${mercadoPagoPaymentId}`,
      );

      const paymentDetails =
        await this._getMercadoPagoPaymentDetails(mercadoPagoPaymentId);

      if (!paymentDetails || !paymentDetails.external_reference) {
        this.logger.warn(
          `Pagamento ${mercadoPagoPaymentId} sem external_reference`,
        );
        return { message: 'Pagamento sem referência externa' };
      }

      const paymentIdFromMP = paymentDetails.external_reference;
      const newStatus =
        paymentDetails.status === 'approved'
          ? PaymentStatus.PAID
          : paymentDetails.status === 'rejected'
            ? PaymentStatus.FAIL
            : PaymentStatus.PENDING;

      this.logger.log(
        `Atualizando pagamento ${paymentIdFromMP} para status: ${newStatus}`,
      );

      await this.paymentService.update(paymentIdFromMP, { status: newStatus });

      return {
        message: `Pagamento ${paymentIdFromMP} atualizado para ${newStatus}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao processar webhook simples: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return { message: 'Erro ao processar webhook' };
    }
  }

  private _handleMerchantOrderWebhook(merchantOrderId: string): {
    message: string;
  } {
    this.logger.log(`Webhook de merchant_order recebido: ${merchantOrderId}`);
    // Merchant order é apenas notificação, não precisa processar
    return { message: 'Merchant order notificado' };
  }

  private async _getMercadoPagoPaymentDetails(
    paymentId: string,
  ): Promise<MercadoPagoPaymentDetails | null> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get<MercadoPagoPaymentDetails>(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
              },
            },
          )
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(
                `Erro ao buscar detalhes do pagamento: ${error.message}`,
              );
              throw error;
            }),
          ),
      );

      return response.data;
    } catch {
      return null;
    }
  }

  @Post('success')
  @HttpCode(200)
  handleSuccess(): { message: string } {
    this.logger.log('Usuário redirecionado para página de sucesso');
    return { message: 'Pagamento aprovado com sucesso' };
  }

  @Post('failure')
  @HttpCode(200)
  handleFailure(): { message: string } {
    this.logger.log('Usuário redirecionado para página de falha');
    return { message: 'Pagamento falhou' };
  }

  @Post('pending')
  @HttpCode(200)
  handlePending(): { message: string } {
    this.logger.log('Usuário redirecionado para página de pendência');
    return { message: 'Pagamento pendente' };
  }
}
