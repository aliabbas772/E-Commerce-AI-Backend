# EcommerceAI Backend

A production grade ecommerce backend built with the MERN stack, GraphQL, and AI powered product recommendations using Gemini AI.

**Live API:** [Add your Render URL here after deploy]

## Overview

This backend powers a full ecommerce platform, covering authentication, catalog management, cart and checkout, payments, search, real time order updates, and background job processing. It was built as a portfolio project to demonstrate backend architecture and system design at a production standard.

## Tech Stack

**Core**

- Node.js, Express.js
- MongoDB with Mongoose
- Apollo Server v4 (GraphQL API)
- TypeScript

**Data and Caching**

- Redis for caching and session storage
- Elasticsearch for product search and filtering _(disabled in hosted demo, see note below)_

**Messaging and Jobs**

- Kafka for event driven communication between services _(disabled in hosted demo, see note below)_
- BullMQ for background job queues (emails, order processing)

**Payments and AI**

- Razorpay for payment processing
- Gemini AI for product recommendations and search assistance

**Real Time**

- WebSockets for live order status and notifications

**Observability**

- Prometheus and Grafana for metrics and monitoring _(disabled in hosted demo, see note below)_

**DevOps**

- Docker for containerization
- CI/CD pipeline for automated build and deploy

## Deployment Note

This project is fully implemented with Kafka, Elasticsearch, and Prometheus/Grafana as shown above. In the free tier hosted demo on Render, these three services are feature flagged off since they require persistent infrastructure that isn't available on free hosting plans. All core functionality (auth, catalog, cart, checkout, payments, GraphQL API, Redis caching, BullMQ jobs, Gemini AI, WebSockets) is fully live and testable.

To run the complete stack including Kafka, Elasticsearch, and monitoring, clone the repo and run locally with Docker Compose.

## Getting Started Locally

```bash
git clone https://github.com/aliabbas772/E-Commerce-AI-Backend.git
cd ecommerceai-backend
npm install
cp .env.example .env
# fill in your MongoDB URI, Redis URL, Razorpay keys, Gemini API key, JWT secret
npm run dev
```

To run the full stack with Kafka, Elasticsearch, and monitoring:

```bash
docker compose up
```

## Environment Variables

| Variable                                  | Description                                     |
| ----------------------------------------- | ----------------------------------------------- |
| `MONGODB_URI`                             | MongoDB connection string                       |
| `REDIS_URL`                               | Redis connection string                         |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay payment credentials                    |
| `GEMINI_API_KEY`                          | Google Gemini AI API key                        |
| `JWT_SECRET`                              | Secret for signing auth tokens                  |
| `DEMO_MODE`                               | Set to `false` to enable Kafka, Elastic search, |
|                                           | Redis, prometheus, grafana locally              |

## API Access

GraphQL Playground: `https://e-commerce-ai-backend-lxva.onrender.com/graphql`
REST health check: `https://e-commerce-ai-backend-lxva.onrender.com/health`

## Author

Built by [Your Name] as a backend architecture and system design portfolio project.
