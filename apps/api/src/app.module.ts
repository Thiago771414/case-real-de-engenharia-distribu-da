import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OrdersModule } from "./orders/orders.module";
import { MetricsModule } from "./metrics/metrics.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    OrdersModule,
    MetricsModule,
  ],
})
export class AppModule {}