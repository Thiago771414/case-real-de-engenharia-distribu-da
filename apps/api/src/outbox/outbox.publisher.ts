import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { OutboxRepository } from "./outbox.repository";
import { KafkaProducer } from "../messaging/kafka.producer";

@Injectable()
export class OutboxPublisher implements OnModuleInit {
  private readonly logger = new Logger(OutboxPublisher.name);

  constructor(
    private readonly repo: OutboxRepository,
    private readonly producer: KafkaProducer,
  ) {}

  onModuleInit() {
    // roda a cada 1s (case simples e realista)
    setInterval(() => this.tick().catch(() => {}), 1000);
  }

  private async tick() {
    const events = await this.repo.fetchUnsent(20);
    if (!events.length) return;

    for (const evt of events) {
      try {
        await this.producer.send(evt.topic, evt.payload, {
          correlationId: evt.correlation_id,
          idempotencyKey: evt.idempotency_key,
          eventType: evt.event_type,
        });

        await this.repo.markSent(evt.id);
        this.logger.log(`Outbox sent id=${evt.id} type=${evt.event_type}`);
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        await this.repo.markFailed(evt.id, msg);
        this.logger.error(`Outbox failed id=${evt.id}: ${msg}`);
      }
    }
  }
}