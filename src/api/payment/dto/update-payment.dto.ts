import { IsEnum, IsOptional } from 'class-validator';
import { PaymentStatus } from '../../../entities/payment.entity';

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(PaymentStatus, {
    message: 'Status de pagamento inválido (PENDING, PAID ou FAIL)',
  })
  status?: PaymentStatus;
}
