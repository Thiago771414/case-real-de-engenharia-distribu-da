import { Body, Controller, Headers, Post } from "@nestjs/common";
import { randomUUID } from "crypto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post()
  create(
    @Body() body: unknown,
    @Headers("x-correlation-id") correlationId?: string,
    @Headers("x-idempotency-key") idempotencyKey?: string,
  ) {
    return this.service.createOrder(body, {
      correlationId: correlationId ?? randomUUID(),
      idempotencyKey: idempotencyKey ?? randomUUID(),
    });
  }
}