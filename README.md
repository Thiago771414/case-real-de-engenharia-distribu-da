# Case real de engenharia distribuída (Event-Driven com Kafka)

Este repositório demonstra um **case real de engenharia distribuída**, implementando uma **arquitetura orientada a eventos (EDA)** com **Kafka**, separando claramente **API (Producer)** e **Worker (Consumer)**.

O foco não é apenas “enviar mensagens”, mas sim **confiabilidade, rastreabilidade e segurança de processamento**.

---

## 🎯 Objetivo do projeto

Demonstrar, de forma prática e próxima de produção, como:

- Separar responsabilidades entre API e Worker
- Trabalhar com eventos assíncronos
- Garantir **idempotência**
- Propagar **correlationId**
- Validar contratos de eventos em runtime
- Processar mensagens com segurança usando Kafka

---

## 🛒 MiniShop — Event-Driven Architecture with Kafka
Este projeto demonstra uma arquitetura orientada a eventos pronta para produção, utilizando NestJS + Kafka, com clara separação entre API (produtor) e Worker (consumidor).
O foco está na confiabilidade, idempotência e contratos de eventos robustos, em vez da simples troca de mensagens.

---

## 1️⃣ Estrutura final do repositório
```ts
minishop-event-driven/
├── apps/
│   ├── api/        # REST API (Producer)
│   ├── worker/     # Kafka Consumer (no HTTP)
│   └── web/        # (opcional / placeholder)
├── infra/
│   └── docker-compose.yml
├── diagrams/
│   └── architecture.png
│   └── architecture.mmd
├── README.md
└── package.json
```
---

## 🧠 Visão geral da arquitetura

- **API**
  - Expõe endpoint REST (`POST /orders`)
  - Valida payload de entrada
  - Publica eventos no Kafka
- **Worker**
  - Não expõe HTTP
  - Consome eventos Kafka
  - Garante idempotência
  - Processa pedidos
  - Publica eventos de saída
  - 
---

## 🧩 Conceitos aplicados

- Event-Driven Architecture (EDA)
- Kafka com Consumer Groups
- Producer / Consumer desacoplados
- Event Envelope Pattern
- Validação de contratos em runtime (Zod)
- Idempotência no consumer
- Correlation ID para rastreabilidade
- Processamento assíncrono seguro
- Infra local com Docker Compose

---

## 📦 Event Envelope Pattern

Todos os eventos seguem um **envelope padrão**, garantindo consistência e rastreabilidade:

```ts
{
  eventId: string
  type: string
  occurredAt: string
  correlationId: string
  idempotencyKey: string
  data: object
}

```
---

## Benefícios

. Reprocessamento seguro

. Observabilidade

. Evolução de eventos

. Debug facilitado

. Compatibilidade futura

---

## 🔄 Fluxo de eventos

Cliente chama POST /orders

API publica orders.created

Worker consome orders.created

Worker processa o pedido

Worker publica orders.processed

---

### Observabilidade

- Métricas no estilo Prometheus (`/metrics`)
- Rastreamento distribuído com OpenTelemetry
- CorrelationId propagado via HTTP → Kafka → Worker
- Métricas para novas tentativas, DLQ e tempo de processamento
  
---

## 📡 Diagrama de arquitetura
  Client -->|POST /orders| API
  API -->|orders.created| Kafka[(Kafka)]
  Kafka -->|consume| Worker
  Worker -->|orders.processed| Kafka
  Worker --> Redis[(Redis)]
  Worker --> DB[(PostgreSQL)]
  
---

## 🧪 Exemplo de uso
Request
```ts
POST /orders
Headers:
  x-correlation-id: corr-001
  x-idempotency-key: order-c1-001
```
```ts
{
  "customerId": "c1",
  "items": [
    { "productId": "p1", "qty": 2, "price": 10.5 }
  ]
}
```
Response
```ts
{
  "orderId": "uuid",
  "status": "created",
  "total": 21
}
```
---

## ⚙️ Como executar o projeto

Subir a infraestrutura
```ts
pnpm infra:up
```
Infra inclui:
Kafka (Redpanda)
Kafka UI
Redis
PostgreSQL

Subir a API
```ts
pnpm -C apps/api start:dev
```
Subir o Worker
```ts
pnpm -C apps/worker start:dev
```
---

## 🛠️ Stack utilizada
  Node.js + TypeScript
  NestJS
  Kafka (Redpanda)
  Zod
  Docker Compose
  Redis
  PostgreSQL
  
---

## ❓ Por que JSON + Zod e não Avro?

Neste case foi adotado JSON com validação em runtime, ao invés de Avro, de forma intencional.

Motivos:
Menor complexidade operacional
Debug mais simples
Contratos explícitos no código
Menos dependência de infraestrutura (Schema Registry)
Excelente para times pequenos e médios
Essa abordagem segue o modelo Schema-on-Read, muito comum em arquiteturas modernas.
usado por:
Netflix
Uber
Stripe
Shopify
AWS EventBridge

---

## 🚀 Possíveis evoluções
Versionamento de eventos (orders.created.v1)
Dead Letter Queue (DLQ)
Retry com backoff exponencial
Métricas e observabilidade
OpenTelemetry
Outbox Pattern
Particionamento por chave de negócio

---

## 👤 Autor - Thiago Reis Lima

Projeto desenvolvido como case profissional, focado em engenharia de software distribuída, mensageria e boas práticas de sistemas assíncronos.

---
