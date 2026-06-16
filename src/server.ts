import "./config/env.ts";
import type { Application } from "express";
import express from "express";
import * as http from "http";
import { ApolloServer } from "@apollo/server";
import cors from "cors";
import { expressMiddleware } from "@apollo/server/express4";
import { connectDB } from "./config/db.ts";
import cookieParser from "cookie-parser";
import { attachUser } from "./middleware/auth.middleware.ts";
import { Context } from "./types/context.types.ts";
import typeDefs from "./graphql/typeDefs/index.ts";
import resolvers from "./graphql/resolvers/index.ts";
import { createIndexes } from "./config/indexes.ts";
import { logger } from "./utils/logger.utils.ts";
import { gracefulShutdown } from "./utils/shutdown.utils";
import helmet from "helmet";
import { connectKafka } from "./config/kafka.ts";
import { healthCheck } from "./utils/healthcheck.utils.ts";
import { globalErrorHandler } from "./middleware/errorHandler.middleware.ts";
import { requestIdMiddleware } from "./middleware/requestId.middleware.ts";
import { syncAllProductsToES } from "./services/search.service.ts";
import { connectElasticsearch } from "./config/elasticsearch.ts";
import { connectPubSub } from "./config/redisPubSub.ts";
import { setupWebSocket } from "./websocket/notification.ws.ts";

const app: Application = express();
const PORT = process.env.PORT || 4000;

const startServer = async (): Promise<void> => {
  await connectDB();
  await connectElasticsearch();
  await syncAllProductsToES();
  await createIndexes();
  await connectPubSub();
  await connectKafka();

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
  });

  await server.start();
  const httpServer = http.createServer(app);
  setupWebSocket(httpServer);

  app.use(requestIdMiddleware);
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: process.env.NODE_ENV === "production",
    }),
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    }),
  );

  app.get("/health", healthCheck);

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        await attachUser(req, res, () => {});
        return { req, user: (req as any).user };
      },
    }),
  );

  app.use(globalErrorHandler);

  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`🔌 WebSocket running on ws://localhost:${PORT}/ws`);
  });
};

startServer();

// You’re not being hired just as a “MERN developer” here — this role is closer to a **10x AI-augmented engineer** who can **design systems + command AI to build them fast and correctly**.

// Let’s break this down properly so you know exactly what to master 👇

// ---

// # 🔥 1. Core Skills You MUST Have (Non-negotiable)

// ## 🧠 A. Strong MERN Fundamentals

// You still need solid fundamentals — AI won’t save you if you don’t understand systems.

// **Frontend (React)**

// * Component architecture (atomic design, reusable components)
// * State management (Context API, Zustand, Redux)
// * Performance (memoization, lazy loading, code splitting)
// * Form handling + validation (React Hook Form, Zod)

// **Backend (Node + Express)**

// * REST API design (clean routes, versioning)
// * Middleware architecture
// * Auth systems (JWT, OAuth, RBAC)
// * Error handling patterns

// **Database**

// * MongoDB schema design (not just CRUD)
// * PostgreSQL (relations, indexing, joins)
// * Query optimization

// 👉 Without this → you’ll generate garbage code with AI.

// ---

// ## ⚙️ B. System Design (VERY IMPORTANT)

// You must think like an architect:

// * Monolith vs Microservices
// * API Gateway patterns
// * Caching (Redis)
// * Rate limiting
// * Background jobs (queues like BullMQ)
// * Event-driven architecture (Kafka, RabbitMQ basics)

// 👉 This is where most candidates fail.

// ---

// # 🤖 2. AI-Orchestration (This is the REAL differentiator)

// This is the heart of the role. Let’s go deep.

// ---

// ## 🧠 What is AI-Orchestration (in simple terms)?

// AI orchestration =
// 👉 **Using AI like a junior developer team that you control, guide, and correct**

// Not:
// ❌ “write a login page”

// But:
// ✅ “design a scalable auth service with refresh tokens, role-based access, and Redis session caching — modular and production-ready”

// ---

// ## 🔥 Core Skills for AI Orchestration

// ### 1. 🧩 Prompt Engineering (Advanced Level)

// You must know how to:

// * Give **structured prompts**
// * Define:

//   * architecture
//   * constraints
//   * tech stack
//   * scalability needs

// **Example:**

// Bad prompt:

// > “Create a Node API”

// Good prompt:

// > “Create a modular Node.js Express API using clean architecture. Include:
// >
// > * controller, service, repository layers
// > * JWT auth with refresh tokens
// > * MongoDB with Mongoose
// > * Redis caching
// > * scalable folder structure”

// 👉 Skill = **thinking clearly, not typing more**

// ---

// ### 2. 🏗️ Architecture-Guided AI Usage

// You should:

// * First design system in your head
// * Then use AI to implement parts

// Flow:

// 1. Define system (manually)
// 2. Break into services
// 3. Ask AI to generate each module
// 4. Review & refine

// 👉 If you skip step 1 → AI gives messy code

// ---

// ### 3. 🔁 Iterative Refinement (CRITICAL)

// AI orchestration is NOT one-shot.

// You must:

// * Debug AI output
// * Refactor it
// * Improve structure

// Example:

// * Step 1: Generate API
// * Step 2: Ask AI to optimize performance
// * Step 3: Add caching
// * Step 4: Add tests

// 👉 Think like a **tech lead reviewing a junior dev**

// ---

// ### 4. 🧪 AI-Assisted Testing

// * Generate unit tests (Jest)
// * Integration tests
// * API contract tests

// Skill:
// 👉 “Ask AI to test edge cases you didn’t think of”

// ---

// ### 5. 🔄 Workflow Automation

// You should build systems like:

// * Auto CRUD generator
// * Schema → API generator
// * AI code templates
// * CLI tools for scaffolding

// Example:

// * Input: DB schema
// * Output: routes + controllers + validation

// 👉 This is how you achieve **2–3x speed**

// ---

// ### 6. 🧠 Understanding LLM Limits

// You must know:

// * AI hallucinates
// * AI writes insecure code sometimes
// * AI doesn’t optimize by default

// So you:

// * Validate logic
// * Check security
// * Improve performance

// ---

// ### 7. 🔌 LLM Integration Skills

// You should know how to:

// * Call APIs (OpenAI, etc.)
// * Build:

//   * Chat systems
//   * RAG pipelines
//   * AI features in apps

// Concepts:

// * Embeddings
// * Vector DB (Pinecone, Supabase)
// * Prompt pipelines

// ---

// # 🧱 3. Microservices + Serverless Thinking

// You need:

// ## Microservices

// * Service separation (auth, payments, users)
// * Communication (REST, events)
// * Independent deployment

// ## Serverless

// * AWS Lambda basics
// * Stateless functions
// * Cold starts
// * API Gateway

// 👉 Know WHEN to use what.

// ---

// # ⚙️ 4. DevOps + Deployment

// * Docker (must know)
// * CI/CD (GitHub Actions)
// * Cloud deploy (AWS / Vercel)
// * Logging & monitoring

// ---

// # 🧠 5. Mindset (This matters more than tools)

// This role is looking for:

// ### ✅ AI-First Thinking

// * “How can AI do 70% of this?”

// ### ✅ Speed + Quality Balance

// * Fast ≠ messy

// ### ✅ Ownership

// * Build end-to-end systems

// ---

// # 🧭 What You Should Do (Practical Roadmap)

// ## Step 1: Strengthen Core

// * Build 2–3 solid MERN apps (auth, dashboard, API)

// ## Step 2: Learn System Design

// * Design:

//   * URL shortener
//   * Chat app
//   * E-commerce backend

// ## Step 3: Practice AI Orchestration

// Do this daily:

// * Build apps ONLY using AI assistance
// * Focus on:

//   * prompting
//   * refining
//   * structuring

// ## Step 4: Build AI Projects

// * Chat app with LLM
// * RAG-based search system
// * AI-powered SaaS tool

// ## Step 5: Automate Yourself

// * Create your own:

//   * boilerplates
//   * scripts
//   * AI workflows

// ---

// # ⚡ Final Reality Check

// If you want to crack this job:

// 👉 You must become:

// * 50% Engineer (core skills)
// * 30% Architect (system design)
// * 20% AI Operator (orchestrator)

// ---

// If you want, I can:
// ✅ Make a **30-day roadmap**
// ✅ Give **real interview questions**
// ✅ Help you build **portfolio projects for this exact role**

// Just tell me 👍
