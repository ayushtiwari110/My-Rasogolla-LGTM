# Atlan Observability Challenge Solution

## Performance Dashboard
![Screenshot 2025-03-31 215055](https://github.com/user-attachments/assets/8734c766-d713-4e2b-930c-60504cb16526)
![Screenshot 2025-03-31 215109](https://github.com/user-attachments/assets/ff193762-639e-4978-b26b-7d71d4fea2e7)
![Screenshot 2025-03-31 215120](https://github.com/user-attachments/assets/f4aa2e91-cd43-4274-a51a-37e262a22fd2)
![Screenshot 2025-03-31 215132](https://github.com/user-attachments/assets/35d6dd6e-27f5-40b9-a34f-13a9240eb0e4)

## NodeJS Runtime Dashboard
![Screenshot 2025-03-31 215320](https://github.com/user-attachments/assets/3878a40f-eb6d-48a8-bd36-674903b4ef34)
![Screenshot 2025-03-31 215327](https://github.com/user-attachments/assets/5605aa4a-0c23-40b9-9aad-40523fe2699c)

## High-Level System Design Diagram
![1000128287](https://github.com/user-attachments/assets/2fa73439-88b5-4435-adcc-ecfd63b66ef4)

## Demonstration Video & Report
Loom Video Link: https://www.loom.com/share/ef2c88a64b844cd89586c014a66c2cce?sid=c58894f5-a0ff-4b31-bdd8-bf0ccf033cc1

Report: https://drive.google.com/file/d/1tfornbEWUZYkiiiAR1QG7Wklgyy9dT3C/view?usp=drivesdk

## Project Overview

This project demonstrates a comprehensive observability solution built for Atlan's Platform Engineering Internship Challenge 2025. The solution addresses the problem of slow, inconsistent, and manual debugging experiences faced by engineering teams.

The application showcases how proper observability practices can transform debugging from a painful process dependent on senior engineers to a data-driven, accessible workflow for all team members.

## Key Features

- **Dual Implementation Approach**: Contrasting v1 (buggy) and v2 (optimized) API endpoints to demonstrate performance differences
- **Multi-dimensional Observability**: Integrated metrics, logging, and distributed tracing
- **Business Impact Visualization**: Connecting technical metrics to business outcomes
- **Performance Comparison**: Real-time dashboards showing 71% improvement between implementations
- **Resource Utilization Tracking**: CPU and memory usage monitoring


## Technology Stack

### Core Framework

- **Next.js**: Full-stack React framework with API routes


### Observability Tools

- **Prometheus** (via prom-client): Metrics collection and storage
- **Grafana**: Data visualization and dashboards
- **Loki**: Log aggregation (with Pino integration)
- **Zipkin**: Distributed tracing
- **OpenTelemetry**: Cross-service instrumentation


### Data Storage

- **MongoDB**: Document database (for user data)
- **Mongoose**: MongoDB object modeling


## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- MongoDB (local or Atlas)


### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/atlan-observability.git
cd atlan-observability
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```
# Create a .env.local file with:
MONGODB_URI=mongodb://localhost:27017/atlan-obs
OTEL_SERVICE_NAME="nextjs-app"
OTEL_LOG_LEVEL="info"

```

4. Start the observability stack:
```bash
docker-compose up -d
```

5. Run the application:
```bash
npm run dev
```

6. Access the services:
    - Application: http://localhost:3000
    - Grafana: http://localhost:3001 (admin/admin)
    - Prometheus: http://localhost:9090
    - Zipkin: http://localhost:9411
    - Loki: http://localhost:3100


## Available API Endpoints

### V1 Endpoints (Buggy)

- `/api/v1/users` - Inefficient user data fetching
- `/api/v1/memory-leak` - Demonstrates memory leaks
- `/api/v1/external-api` - Unoptimized external API calls
- `/api/v1/cpu-intensive` - CPU-heavy operations


### V2 Endpoints (Optimized)

- `/api/v2/users` - Efficient user data fetching with pagination
- `/api/v2/memory-efficient` - Memory usage optimization
- `/api/v2/external-api` - Improved external API integration
- `/api/v2/cpu-optimised` - Optimized CPU operations


## Dashboard Components

The Grafana dashboard is organized into several sections:

1. **Business Impact**
    - User signups by plan type
    - Referral source tracking
    - Login success rate
    - Estimated revenue impact
2. **Resource Utilization**
    - CPU usage
    - Memory consumption
3. **API Performance**
    - Response time comparison (p95)
    - Error rates by endpoint
    - Request volume metrics
4. **External API Dependencies**
    - External service latency
    - Error tracking
5. **User Experience \& SLO Tracking**
    - Performance improvement metrics
    - Traffic volume analysis

## Load Testing

The project includes a load testing script to generate realistic traffic patterns:

```bash
node scripts/load-test.js
```

This script simulates user traffic to both v1 and v2 endpoints, helping visualize performance differences in real-time.

## Dependencies

- **@opentelemetry/api**: OpenTelemetry API for distributed tracing
- **@vercel/otel**: Vercel's OpenTelemetry integration
- **pino \& pino-loki**: Structured logging with Loki integration
- **prom-client**: Prometheus client for metrics collection
- **mongodb \& mongoose**: MongoDB integration
- **node-fetch**: HTTP client for external API calls


## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Atlan for providing the observability challenge
- The open source community for the excellent observability tools

---
