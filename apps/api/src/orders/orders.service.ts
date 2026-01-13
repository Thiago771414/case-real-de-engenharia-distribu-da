import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { KafkaProducer } from "../messaging/kafka.producer";
import { TOPICS } from "../messaging/topics";
import { calcTotal, CreateOrderBodySchema } from "./orders.schema";
import { OrdersCreatedEvent } from "./orders.events";

@Injectable()
export class OrdersService {
  constructor(private readonly producer: KafkaProducer) {}

  async createOrder(
    input: unknown,
    headers: { correlationId?: string; idempotencyKey?: string },
  ) {
    const body = CreateOrderBodySchema.parse(input);

    const correlationId = headers.correlationId ?? randomUUID();
    const idempotencyKey = headers.idempotencyKey ?? randomUUID();

    const orderId = randomUUID();
    const total = calcTotal(body.items);

    const event: OrdersCreatedEvent = {
      eventId: randomUUID(),
      type: "orders.created.v1",
      occurredAt: new Date().toISOString(),
      correlationId,
      idempotencyKey,
      data: {
        orderId,
        customerId: body.customerId,
        total,
        items: body.items,
      },
    };

    await this.producer.send(TOPICS.ORDERS_CREATED, event, {
      correlationId,
      idempotencyKey,
      eventType: event.type,
    });

    return {
      orderId,
      status: "created",
      total,
    };
  }
}