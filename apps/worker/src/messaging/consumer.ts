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
  ) { }

  async onModuleInit() {
    // ✅ cria depois que o Nest injetou KafkaClient
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
          this.logger.error(`Invalid payload on ${topic}: ${parsed.error.message}`);
          return;
        }

        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        await this.consumer.run({
          eachMessage: async ({ topic, message }) => {
            const raw = message.value?.toString() ?? "";
            if (!raw) return;

            let json: unknown;
            try { json = JSON.parse(raw); } catch {
              this.logger.error(`Invalid JSON on ${topic}: ${raw}`);
              return;
            }

            const parsed = OrdersCreatedEventSchema.safeParse(json);
            if (!parsed.success) {
              this.logger.error(`Invalid payload on ${topic}: ${parsed.error.message}`);
              return;
            }

            const evt = parsed.data;
            const maxRetries = Number(process.env.WORKER_MAX_RETRIES ?? 5);
            const baseMs = Number(process.env.WORKER_RETRY_BASE_MS ?? 200);

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
              try {
                await this.orders.handleOrdersCreated(evt);
                return;
              } catch (err: any) {
                const isLast = attempt === maxRetries;
                const msg = err?.message ?? String(err);

                if (isLast) {
                  this.logger.error(`Poison message => DLQ. attempt=${attempt} correlationId=${evt.correlationId} error=${msg}`);

                  await this.orders.publishDlq({
                    originalEvent: evt,
                    attempts: attempt + 1,
                    error: { message: msg, stack: err?.stack },
                  });

                  return;
                }

                const jitter = Math.floor(Math.random() * 100);
                const wait = baseMs * Math.pow(2, attempt) + jitter;

                this.logger.warn(`Retrying attempt=${attempt + 1}/${maxRetries} in ${wait}ms correlationId=${evt.correlationId} error=${msg}`);
                await sleep(wait);
              }
            }
          },
        });
      },
    });

    this.logger.log(`Consuming: ${TOPICS.ORDERS_CREATED}`);
  }

  async onModuleDestroy() {
    await this.consumer?.disconnect();
    // ⚠️ não desconecta producer aqui, porque quem usa é o OrdersProcessor
    // (se você quiser, pode criar um shutdown central no KafkaClient depois)
  }
}
