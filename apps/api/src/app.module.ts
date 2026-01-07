import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OrdersModule } from "./orders/orders.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // <- garante ConfigService em todo lugar
    OrdersModule,
  ],
})
export class AppModule {}
