import { Module } from "@nestjs/common";
import { MessagingModule } from "../messaging/messaging.module";
import { MetricsModule } from "../metrics/metrics.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [
    MessagingModule, // KafkaProducer
    MetricsModule,   // MetricsService (exportado)
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}