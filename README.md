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
