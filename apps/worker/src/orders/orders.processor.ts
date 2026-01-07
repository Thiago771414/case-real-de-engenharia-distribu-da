import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { KafkaClient } from "../messaging/kafka";
import { TOPICS } from "../messaging/topics";
import { IdempotencyStore } from "./idempotency.store";
import {
  OrdersCreatedEvent,
  OrdersProcessedEventSchema,
} from "./orders.events";

@Injectable()
export class OrdersProcessor {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private readonly kafka: KafkaClient,
    private readonly idem: IdempotencyStore,
  ) {}

  async handleOrdersCreated(evt: OrdersCreatedEvent) {
    const orderId = evt.data.orderId;
    const key = `orders.created:${orderId}`;

    const existing = await this.idem.get(key);
    if (existing) {
      this.logger.warn(`Skipping duplicate orderId=${orderId}`);
      return;
    }

    await this.idem.set(key, { processedAt: new Date().toISOString() });

    this.logger.log(
      `Processing orderId=${orderId} total=${evt.data.total} correlationId=${evt.correlationId}`,
    );

    const processed = {
      eventId: randomUUID(),
      type: "orders.processed" as const,
      occurredAt: new Date().toISOString(),
      correlationId: evt.correlationId,
      idempotencyKey: evt.idempotencyKey,
      data: {
        orderId,
        status: "processed" as const,
      },
    };

    const ok = OrdersProcessedEventSchema.safeParse(processed);
    if (!ok.success) {
      throw new Error(`Invalid orders.processed payload: ${ok.error.message}`);
    }

    const producer = this.kafka.producer();
    await producer.connect(); // (pode otimizar depois e manter conectado)
    await producer.send({
      topic: TOPICS.ORDERS_PROCESSED,
      messages: [{ value: JSON.stringify(processed) }],
    });
    await producer.disconnect();

    this.logger.log(`Published ${TOPICS.ORDERS_PROCESSED} for orderId=${orderId}`);
  }
}
