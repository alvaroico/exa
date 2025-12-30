import {
  IsString,
  IsNotEmpty,
  IsEnum,
  ValidationOptions,
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PaymentMethod } from '../../../entities/payment.entity';
import { CpfValidator } from '../../../utils/cpf.validator';

@ValidatorConstraint({ name: 'isCpfValid', async: false })
class IsCpfValidConstraint implements ValidatorConstraintInterface {
  validate(cpf: string): boolean {
    return CpfValidator.isValid(cpf);
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
  @IsNotEmpty({ message: 'CPF é obrigatório' })
  @IsString({ message: 'CPF deve ser uma string' })
  @IsCpfValid({ message: 'CPF inválido' })
  cpf: string;

  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @IsString({ message: 'Descrição deve ser uma string' })
  description: string;

  @IsNotEmpty({ message: 'Valor é obrigatório' })
  amount: number;

  @IsNotEmpty({ message: 'Método de pagamento é obrigatório' })
  @IsEnum(PaymentMethod, {
    message: 'Método de pagamento inválido (PIX ou CREDIT_CARD)',
  })
  paymentMethod: PaymentMethod;
}
