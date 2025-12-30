import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentPixDto {
  @ApiProperty({
    description: 'CPF do pagador',
    example: '12345678901',
  })
  cpf: string;

  @ApiProperty({
    description: 'Descrição do pagamento',
    example: 'Pagamento de fatura',
  })
  description: string;

  @ApiProperty({
    description: 'Valor do pagamento',
    example: 150.5,
  })
  amount: number;

  @ApiProperty({
    description: 'Método de pagamento',
    enum: ['PIX'],
    example: 'PIX',
  })
  paymentMethod: 'PIX';
}

