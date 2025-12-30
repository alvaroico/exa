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
import { Payment, PaymentMethod } from '../../entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@ApiTags('Payment')
@Controller('api/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Adicionar Pagamento' })
  @ApiResponse({ status: 201, description: 'Pagamento criado com sucesso' })
  async create(@Body() createPaymentDto: CreatePaymentDto): Promise<Payment> {
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
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment | null> {
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar Pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento deletado' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.paymentService.delete(id);
  }
}
