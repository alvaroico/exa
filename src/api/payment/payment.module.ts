import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../entities/payment.entity';
import { MercadoPago } from '../../entities/mercado-pago.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentWebhookController } from './payment-webhook.controller';
import { MercadoPagoModule } from '../../external/mercado-pago/mercado-pago.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, MercadoPago]),
    MercadoPagoModule,
    HttpModule,
  ],
  providers: [PaymentService],
  controllers: [PaymentController, PaymentWebhookController],
  exports: [PaymentService],
})
export class PaymentsModule {}
