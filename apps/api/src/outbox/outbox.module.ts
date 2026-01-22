import { Module } from "@nestjs/common";
import { DbModule } from "../db/db.module";
import { MessagingModule } from "../messaging/messaging.module";
import { OutboxRepository } from "./outbox.repository";
import { OutboxPublisher } from "./outbox.publisher";

@Module({
  imports: [DbModule, MessagingModule], // ✅ traz DbService e KafkaProducer
  providers: [OutboxRepository, OutboxPublisher],
  exports: [OutboxRepository, OutboxPublisher],
})
export class OutboxModule {}