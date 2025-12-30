import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  ValidationOptions,
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../../entities/payment.entity';
import { CpfValidator } from '../../../utils/cpf.validator';

@ValidatorConstraint({ name: 'isCpfValid', async: false })
class IsCpfValidConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    return CpfValidator.isValid(value);
  }

  defaultMessage(): string {
    return 'CPF inválido';
  }
}

function IsCpfValid(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCpfValidConstraint,
    });
  };
}

export class CreatePaymentDto {
  @ApiProperty({
    description: 'CPF do pagador',
    example: '12345678901',
  })
  @IsNotEmpty({ message: 'CPF é obrigatório' })
  @IsString({ message: 'CPF deve ser uma string' })
  @IsCpfValid({ message: 'CPF inválido' })
  cpf: string;

  @ApiProperty({
    description: 'Descrição da cobrança',
    example: 'Pagamento de fatura',
  })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @IsString({ message: 'Descrição deve ser uma string' })
  description: string;

  @ApiProperty({
    description: 'Valor da transação',
    example: 150.5,
  })
  @IsNotEmpty({ message: 'Valor é obrigatório' })
  @IsNumber({}, { message: 'Valor deve ser um número' })
  amount: number;

  @ApiProperty({
    description: 'Método de pagamento',
    enum: ['PIX', 'CREDIT_CARD'],
    example: 'PIX',
  })
  @IsNotEmpty({ message: 'Método de pagamento é obrigatório' })
  @IsEnum(PaymentMethod, {
    message: 'Método de pagamento inválido (PIX ou CREDIT_CARD)',
  })
  paymentMethod: PaymentMethod;
}
