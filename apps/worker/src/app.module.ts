import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MessagingModule } from "./messaging/messaging.module";
import { MetricsModule } from "./metrics/metrics.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    MessagingModule,
    MetricsModule,
  ],
})
export class AppModule {}