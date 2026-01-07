// apps/worker/src/orders/processor.ts
import { Injectable } from "@nestjs/common";

@Injectable()
export class OrdersProcessor {
  async process(payload: any) {
    // aqui a gente vai simular pagamento/estoque etc
    return { ok: true, payload };
  }
}
