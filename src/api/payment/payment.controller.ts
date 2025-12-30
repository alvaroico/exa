import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';
import { PaymentService, PaymentWithCheckoutUrl } from './payment.service';
import { PaymentMethod } from '../../entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CreatePaymentPixDto } from './dto/create-payment-pix.dto';
import { CreatePaymentCreditCardDto } from './dto/create-payment-credit-card.dto';

@ApiTags('Payment')
@ApiExtraModels(CreatePaymentPixDto, CreatePaymentCreditCardDto)
@Controller('api/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({
    summary: 'Adicionar Pagamento',
    description:
      'Cria um novo pagamento. Pode ser via PIX ou CREDIT_CARD. CPF deve ser válido.',
  })
  @ApiBody({
    type: CreatePaymentDto,
    examples: {
      PIX: {
        summary: 'Exemplo com PIX',
        description: 'Pagamento via PIX',
        value: {
          cpf: '12345678901',
          description: 'Pagamento de fatura',
          amount: 150.5,
          paymentMethod: 'PIX',
        } as CreatePaymentPixDto,
      },
      CREDIT_CARD: {
        summary: 'Exemplo com CREDIT_CARD',
        description: 'Pagamento via Cartão de Crédito',
        value: {
          cpf: '98765432100',
          description: 'Compra online',
          amount: 299.99,
          paymentMethod: 'CREDIT_CARD',
        } as CreatePaymentCreditCardDto,
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Pagamento criado com sucesso',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        cpf: '12345678901',
        description: 'Pagamento de fatura',
        amount: '150.50',
        paymentMethod: 'CREDIT_CARD',
        status: 'PENDING',
        checkoutUrl:
          'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=420611598-5d41ae34-2b54-49ce-8c6a-8e4f67d735a4',
        createdAt: '2025-12-29T20:30:00.000Z',
        updatedAt: '2025-12-29T20:30:00.000Z',
      },
    },
  })
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentWithCheckoutUrl> {
    return this.paymentService.create(
      createPaymentDto.cpf,
      createPaymentDto.description,
      createPaymentDto.amount,
      createPaymentDto.paymentMethod,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar Pagamentos' })
  @ApiResponse({ status: 200, description: 'Lista de pagamentos' })
  async findAll(
    @Query('cpf') cpf?: string,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
  ): Promise<PaymentWithCheckoutUrl[]> {
    return this.paymentService.findAll({ cpf, paymentMethod });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar Pagamento por ID' })
  @ApiResponse({ status: 200, description: 'Pagamento encontrado' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Pagamento não localizado' })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PaymentWithCheckoutUrl> {
    return this.paymentService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar Pagamento',
    description:
      'Atualiza o status de um pagamento existente. Apenas o status pode ser alterado.',
  })
  @ApiBody({
    description: 'Dados de atualização do pagamento',
    examples: {
      PAID: {
        summary: 'Marcar como PAID',
        description: 'Atualiza o status do pagamento para PAID (Pago)',
        value: {
          status: 'PAID',
        },
      },
      FAIL: {
        summary: 'Marcar como FAIL',
        description: 'Atualiza o status do pagamento para FAIL (Falha)',
        value: {
          status: 'FAIL',
        },
      },
      PENDING: {
        summary: 'Marcar como PENDING',
        description: 'Atualiza o status do pagamento para PENDING (Pendente)',
        value: {
          status: 'PENDING',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Pagamento atualizado' })
  @ApiResponse({ status: 400, description: 'ID inválido ou status inválido' })
  @ApiResponse({ status: 404, description: 'Pagamento não localizado' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentWithCheckoutUrl> {
    return this.paymentService.update(id, updatePaymentDto);
  }
}
