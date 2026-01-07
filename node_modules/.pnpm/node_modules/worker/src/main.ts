import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  // ✅ sem HTTP
  await NestFactory.createApplicationContext(AppModule);
  console.log("[WORKER] Started (no HTTP)");
}

bootstrap();
