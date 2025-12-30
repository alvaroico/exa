import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentCreditCardDto {
  @ApiProperty({
    description: 'CPF do pagador',
    example: '98765432100',
  })
  cpf: string;

  @ApiProperty({
    description: 'Descrição do pagamento',
    example: 'Compra online',
  })
  description: string;

  @ApiProperty({
    description: 'Valor do pagamento',
    example: 299.99,
  })
  amount: number;

  @ApiProperty({
    description: 'Método de pagamento',
    enum: ['CREDIT_CARD'],
    example: 'CREDIT_CARD',
  })
  paymentMethod: 'CREDIT_CARD';
}
