import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import type { Consumer } from "kafkajs";
import { KafkaClient } from "./kafka";
import { TOPICS } from "./topics";
import { OrdersProcessor } from "../orders/orders.processor";
import { OrdersCreatedEventSchema } from "../orders/orders.events";

@Injectable()
export class KafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumer.name);
  private consumer!: Consumer;

  constructor(
    private readonly kafka: KafkaClient,
    private readonly orders: OrdersProcessor,
  ) {}

  async onModuleInit() {
    this.consumer = this.kafka.consumer("minishop-worker-group");

    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: TOPICS.ORDERS_CREATED,
      fromBeginning: true,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const raw = message.value?.toString() ?? "";
        if (!raw) return;

        let json: unknown;
        try {
          json = JSON.parse(raw);
        } catch {
          this.logger.error(`Invalid JSON on ${topic}: ${raw}`);
          return;
        }

        const parsed = OrdersCreatedEventSchema.safeParse(json);
        if (!parsed.success) {
          this.logger.error(
            `Invalid payload on ${topic}: ${parsed.error.message}`,
          );
          return;
        }

        const evt = parsed.data;

        try {
          // ✅ Aqui é o ponto certo: o OrdersProcessor já faz retry + DLQ + métricas + spans
          await this.orders.processWithRetry(evt);
        } catch (err) {
          // Em tese não deveria estourar porque processWithRetry manda pra DLQ no fim,
          // mas deixamos log defensivo.
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Unhandled error processing message correlationId=${evt.correlationId} orderId=${evt.data.orderId} err=${msg}`,
          );
        }
      },
    });

    this.logger.log(`Consuming: ${TOPICS.ORDERS_CREATED}`);
  }

  async onModuleDestroy() {
    await this.consumer?.disconnect();
  }
}