import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { KafkaClient } from "./messaging/kafka";
import { KafkaConsumer } from "./messaging/consumer";
import { IdempotencyStore } from "./orders/idempotency.store";
import { OrdersProcessor } from "./orders/orders.processor";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [KafkaClient, KafkaConsumer, IdempotencyStore, OrdersProcessor],
})
export class AppModule {}
