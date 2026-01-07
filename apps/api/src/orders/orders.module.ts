import { Module } from "@nestjs/common";
import { MessagingModule } from "../messaging/messaging.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [MessagingModule], // <- traz KafkaProducer para o contexto
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
