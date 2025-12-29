import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../../entities/payment.entity';

@ApiTags('payments')
@Controller('api/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Adicionar Pagamento' })
  @ApiResponse({ status: 201, description: 'Pagamento criado com sucesso' })
  async create(
    @Body()
    body: {
      cpf: string;
      description: string;
      amount: number;
      paymentMethod: PaymentMethod;
    },
  ): Promise<Payment> {
    return this.paymentService.create(
      body.cpf,
      body.description,
      body.amount,
      body.paymentMethod,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar Pagamentos' })
  @ApiResponse({ status: 200, description: 'Lista de pagamentos' })
  async findAll(
    @Query('cpf') cpf?: string,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
  ): Promise<Payment[]> {
    return this.paymentService.findAll({ cpf, paymentMethod });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar Pagamento por ID' })
  @ApiResponse({ status: 200, description: 'Pagamento encontrado' })
  async findOne(@Param('id') id: string): Promise<Payment | null> {
    return this.paymentService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar Pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento atualizado' })
  async update(
    @Param('id') id: string,
    @Body() body: { status?: PaymentStatus },
  ): Promise<Payment | null> {
    return this.paymentService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar Pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento deletado' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.paymentService.delete(id);
  }
}
