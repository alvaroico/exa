import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError } from 'axios';

interface MercadoPagoPreference {
  items: Array<{
    title: string;
    description: string;
    quantity: number;
    currency_id: string;
    unit_price: number;
  }>;
  payer?: {
    name?: string;
    email?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  payment_methods?: {
    excluded_payment_methods?: Array<{ id: string }>;
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  notification_url?: string;
  external_reference: string;
}

interface MercadoPagoResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  date_created: string;
  external_reference: string;
}

interface MercadoPagoPreferenceResult {
  preferenceId: string;
  checkoutUrl: string;
  rawResponse: unknown;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  private readonly baseUrl = 'https://api.mercadopago.com/checkout/preferences';
  private readonly backendUrl =
    process.env.BACKEND_URL || 'http://localhost:3000';

  constructor(private readonly httpService: HttpService) {
    if (!this.accessToken) {
      throw new Error(
        'MERCADO_PAGO_ACCESS_TOKEN não está definido nas variáveis de ambiente',
      );
    }
  }

  async createPreference(
    paymentId: string,
    amount: number,
    description: string,
    cpf: string,
  ): Promise<MercadoPagoPreferenceResult> {
    const preference: MercadoPagoPreference = {
      items: [
        {
          title: 'Pagamento de Cobrança',
          description,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amount,
        },
      ],
      payer: {
        email: 'cliente@example.com',
        identification: {
          type: 'CPF',
          number: cpf,
        },
      },
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
        installments: 12,
      },
      back_urls: {
        success: `${this.backendUrl}/api/payment/success`,
        failure: `${this.backendUrl}/api/payment/failure`,
        pending: `${this.backendUrl}/api/payment/pending`,
      },
      notification_url: `${this.backendUrl}/api/payment/webhook`,
      external_reference: paymentId,
    };

    try {
      this.logger.log(
        `Criando preferência no Mercado Pago para pagamento ${paymentId}`,
      );

      const response = await firstValueFrom(
        this.httpService
          .post<MercadoPagoResponse>(this.baseUrl, preference, {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          })
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(
                `Erro ao criar preferência no Mercado Pago: ${error.message}`,
                error.response?.data,
              );
              throw error;
            }),
          ),
      );

      // LOG DETALHADO DO RETORNO DO MERCADO PAGO
      this.logger.log(
        `Resposta bruta do Mercado Pago para pagamento ${paymentId}: ${JSON.stringify(
          response.data,
        )}`,
      );
      // eslint-disable-next-line no-console
      console.log(
        'MercadoPago createPreference response.data =',
        response.data,
      );

      const checkoutUrl =
        response.data.sandbox_init_point || response.data.init_point;

      this.logger.log(
        `Preferência ${response.data.id} criada com sucesso para pagamento ${paymentId}`,
      );

      return {
        preferenceId: response.data.id,
        checkoutUrl,
        rawResponse: response.data,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      throw new HttpException(
        `Erro ao criar preferência no Mercado Pago: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
