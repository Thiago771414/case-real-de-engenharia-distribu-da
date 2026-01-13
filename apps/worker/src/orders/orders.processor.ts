import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { KafkaClient } from "../messaging/kafka";
import { TOPICS } from "../messaging/topics";
import { IdempotencyStore } from "./idempotency.store";
import {
  OrdersCreatedEvent,
  OrdersProcessedEventSchema,
} from "./orders.events";
import { OrdersCreatedDlqEventSchema } from "./orders.events";

@Injectable()
export class OrdersProcessor {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private readonly kafka: KafkaClient,
    private readonly idem: IdempotencyStore,
  ) { }

  async publishDlq(input: {
    originalEvent: OrdersCreatedEvent;
    attempts: number;
    error: { message: string; stack?: string };
  }) {
    const dlq = {
      eventId: randomUUID(),
      type: "orders.created.dlq.v1" as const,
      occurredAt: new Date().toISOString(),
      correlationId: input.originalEvent.correlationId,
      idempotencyKey: input.originalEvent.idempotencyKey,
      attempts: input.attempts,
      error: input.error,
      originalEvent: input.originalEvent,
    };

    const ok = OrdersCreatedDlqEventSchema.safeParse(dlq);
    if (!ok.success) throw new Error(`Invalid DLQ payload: ${ok.error.message}`);

    const producer = this.kafka.producer();
    await producer.connect();
    await producer.send({
      topic: TOPICS.ORDERS_CREATED_DLQ,
      messages: [{ value: JSON.stringify(dlq) }],
    });
    await producer.disconnect();
  }

  async handleOrdersCreated(evt: OrdersCreatedEvent) {
    const orderId = evt.data.orderId;
    const key = `orders.created.v1:${evt.idempotencyKey}`;

    const existing = await this.idem.get(key);
    if (existing) {
      this.logger.warn(`Skipping duplicate idempotencyKey=${evt.idempotencyKey} orderId=${orderId}`);
      return;
    }

    await this.idem.set(key, { processedAt: new Date().toISOString() });

    this.logger.log(
      `Processing orderId=${orderId} total=${evt.data.total} correlationId=${evt.correlationId}`,
    );

    const processed = {
      eventId: randomUUID(),
      type: "orders.processed.v1" as const,
      occurredAt: new Date().toISOString(),
      correlationId: evt.correlationId,
      idempotencyKey: evt.idempotencyKey,
      data: { orderId, status: "processed" as const },
    };

    const ok = OrdersProcessedEventSchema.safeParse(processed);
    if (!ok.success) {
      throw new Error(`Invalid orders.processed payload: ${ok.error.message}`);
    }

    const producer = this.kafka.producer();
    await producer.connect(); // (pode otimizar depois e manter conectado)

    await producer.send({
      topic: TOPICS.ORDERS_PROCESSED,
      messages: [{
        value: JSON.stringify(processed),
        headers: {
          "x-correlation-id": evt.correlationId,
          "x-idempotency-key": evt.idempotencyKey,
          "x-event-type": processed.type,
        },
      }],
    });

    await this.idem.set(key, { processedAt: new Date().toISOString(), orderId });

    await producer.disconnect();

    this.logger.log(`Published ${TOPICS.ORDERS_PROCESSED} for orderId=${orderId}`);
  }
}
