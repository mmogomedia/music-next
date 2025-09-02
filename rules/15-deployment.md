# Phase 15: Deployment

## 🎯 Objective
Implement production-ready deployment infrastructure including Docker containerization, cloud deployment (AWS/Vercel), monitoring, logging, and production optimizations to ensure the platform is scalable, secure, and maintainable in production.

## 📋 Prerequisites
- Phase 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, & 14 completed successfully
- All tests passing
- Code quality standards met
- Production environment configured

## 🚀 Step-by-Step Implementation

### 1. Production Environment Configuration

#### `.env.production`
```bash
# Database
DATABASE_URL="postgresql://username:password@production-host:5432/flemoji_prod"
DATABASE_CONNECTION_TIMEOUT=30000
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# NextAuth
NEXTAUTH_SECRET="your-production-secret-key-here"
NEXTAUTH_URL="https://yourdomain.com"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="flemoji-production-bucket"

# Stripe
STRIPE_SECRET_KEY="sk_live_your-production-stripe-key"
STRIPE_PUBLISHABLE_KEY="pk_live_your-production-stripe-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
STRIPE_PREMIUM_PRICE_ID="price_your-premium-price-id"
STRIPE_ARTIST_PRO_PRICE_ID="price_your-artist-pro-price-id"

# Redis (for caching)
REDIS_URL="redis://your-redis-host:6379"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
DATADOG_API_KEY="your-datadog-api-key"

# CDN
NEXT_PUBLIC_CDN_URL="https://your-cdn-domain.com"

# Security
CORS_ORIGIN="https://yourdomain.com"
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

### 2. Docker Configuration

#### `Dockerfile`
```dockerfile
# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### `Dockerfile.dev`
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["yarn", "dev"]
```

#### `docker-compose.yml`
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://flemoji:password@db:5432/flemoji_prod
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - flemoji-network

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=flemoji_prod
      - POSTGRES_USER=flemoji
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./prisma/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - flemoji-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - flemoji-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - flemoji-network

volumes:
  postgres_data:
  redis_data:

networks:
  flemoji-network:
    driver: bridge
```

### 3. Nginx Configuration

#### `nginx/nginx.conf`
```nginx
events {
    worker_connections 1024;
}

http {
    upstream flemoji_app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header Strict-Transport-Security "max-age=63072000" always;

        # Client max body size for file uploads
        client_max_body_size 100M;

        # Static file caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://flemoji_app;
        }

        # API rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://flemoji_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Login rate limiting
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://flemoji_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Main application
        location / {
            proxy_pass http://flemoji_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support for real-time features
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### 4. Production Next.js Configuration

#### `next.config.js` (Production)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: [
      'your-s3-bucket.s3.amazonaws.com',
      'your-cdn-domain.com',
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },
  
  // Bundle analyzer (only in production builds)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true,
        })
      )
      return config
    },
  }),
  
  // Output standalone for Docker
  output: 'standalone',
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ]
  },
  
  // Rewrites
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health-check',
      },
    ]
  },
}

module.exports = nextConfig
```

### 5. Health Check API

#### `src/app/api/health/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check Redis connection (if using Redis)
    // const redis = new Redis(process.env.REDIS_URL!)
    // await redis.ping()
    
    // Check S3 connection (if using S3)
    // const s3 = new AWS.S3()
    // await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET! }).promise()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'healthy',
        redis: 'healthy',
        s3: 'healthy',
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: 'unhealthy',
        redis: 'unhealthy',
        s3: 'unhealthy',
      }
    }, { status: 503 })
  }
}
```

### 6. Monitoring and Logging

#### `src/lib/monitoring.ts`
```typescript
import * as Sentry from '@sentry/nextjs'

export const initMonitoring = () => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: ['localhost', 'yourdomain.com'],
        }),
      ],
    })
  }
}

export const captureException = (error: Error, context?: any) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
    })
  }
  console.error('Error:', error, context)
}

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, level)
  }
  console.log(`[${level.toUpperCase()}]:`, message)
}

export const startTransaction = (name: string, operation: string) => {
  if (process.env.NODE_ENV === 'production') {
    return Sentry.startTransaction({
      name,
      op: operation,
    })
  }
  return null
}
```

#### `src/lib/logger.ts`
```typescript
import winston from 'winston'

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(logColors)

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
)

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  new winston.transports.File({ filename: 'logs/all.log' }),
]

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels: logLevels,
  format,
  transports,
})

export const logRequest = (req: any, res: any, next: any) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.http(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`)
  })
  
  next()
}
```

### 7. AWS Deployment Scripts

#### `scripts/deploy-aws.sh`
```bash
#!/bin/bash

# AWS Deployment Script
set -e

# Configuration
APP_NAME="flemoji"
REGION="us-east-1"
CLUSTER_NAME="flemoji-cluster"
SERVICE_NAME="flemoji-service"
TASK_DEFINITION="flemoji-task"

echo "🚀 Starting AWS deployment..."

# Build Docker image
echo "📦 Building Docker image..."
docker build -t $APP_NAME:latest .

# Tag image for ECR
ECR_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$APP_NAME"
docker tag $APP_NAME:latest $ECR_REPO:latest

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPO

# Push image to ECR
echo "⬆️ Pushing image to ECR..."
docker push $ECR_REPO:latest

# Update ECS task definition
echo "🔄 Updating ECS task definition..."
aws ecs register-task-definition \
  --family $TASK_DEFINITION \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 512 \
  --memory 1024 \
  --execution-role-arn arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole \
  --task-role-arn arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskRole \
  --container-definitions '[
    {
      "name": "'$APP_NAME'",
      "image": "'$ECR_REPO:latest'",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "'$DATABASE_URL'"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/'$APP_NAME'",
          "awslogs-region": "'$REGION'",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]'

# Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --task-definition $TASK_DEFINITION \
  --region $REGION

# Wait for service to stabilize
echo "⏳ Waiting for service to stabilize..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: https://yourdomain.com"
```

### 8. Vercel Deployment Configuration

#### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 9. GitHub Actions Deployment

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'yarn'
    
    - name: Install dependencies
      run: yarn install --frozen-lockfile
    
    - name: Run tests
      run: yarn test:ci
    
    - name: Run E2E tests
      run: yarn test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ secrets.AWS_REGION }}
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build, tag, and push image to Amazon ECR
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: flemoji
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
    
    - name: Deploy to ECS
      run: |
        aws ecs update-service \
          --cluster flemoji-cluster \
          --service flemoji-service \
          --force-new-deployment
    
    - name: Wait for deployment to complete
      run: |
        aws ecs wait services-stable \
          --cluster flemoji-cluster \
          --services flemoji-service

  deploy-vercel:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
```

### 10. Production Monitoring Dashboard

#### `src/app/admin/monitoring/page.tsx`
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MonitoringDashboard from '@/components/admin/MonitoringDashboard'

export default async function MonitoringPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Production Monitoring
          </h1>
          <p className="mt-2 text-gray-600">
            Real-time monitoring of system performance and health
          </p>
        </div>

        <MonitoringDashboard />
      </div>
    </div>
  )
}
```

## ✅ Deployment Requirements

### Before Going Live:
1. **All tests passing** - Unit, integration, and E2E tests succeed
2. **Performance benchmarks met** - Lighthouse scores above 90
3. **Security audit passed** - No critical vulnerabilities
4. **Monitoring configured** - Logging, error tracking, and health checks
5. **Backup strategy** - Database and file backups configured
6. **SSL certificates** - HTTPS properly configured
7. **CDN setup** - Static assets served via CDN
8. **Rate limiting** - API protection implemented

### Deployment Commands:
```bash
# Docker deployment
docker-compose up -d

# AWS ECS deployment
./scripts/deploy-aws.sh

# Vercel deployment
vercel --prod

# Health check
curl https://yourdomain.com/api/health
```

## 🚨 Common Issues & Solutions

### Issue: Docker build failing
**Solution**: Check Dockerfile syntax, verify dependencies, check build context

### Issue: Database connection failing
**Solution**: Verify connection strings, check network access, validate credentials

### Issue: SSL certificate errors
**Solution**: Check certificate validity, verify domain configuration, test SSL setup

### Issue: Performance degradation
**Solution**: Enable caching, optimize database queries, implement CDN

## 📝 Notes
- Implement blue-green deployment for zero-downtime updates
- Set up automated backups and disaster recovery
- Configure alerting for critical system issues
- Implement A/B testing infrastructure
- Consider multi-region deployment for global users

## 🎉 **Project Complete!**

Congratulations! You have successfully completed all 15 phases of building your Next.js music streaming platform. Your platform now includes:

### **Complete Feature Set**
- ✅ User authentication and management
- ✅ Music upload and streaming
- ✅ Artist dashboard and analytics
- ✅ Smart links and cross-platform sharing
- ✅ Subscription system with Stripe
- ✅ Premium features and analytics
- ✅ Admin dashboard and moderation
- ✅ Comprehensive testing suite
- ✅ Production deployment infrastructure

### **Production Ready**
- 🚀 Scalable architecture
- 🔒 Security best practices
- 📊 Monitoring and logging
- 🐳 Containerized deployment
- ☁️ Cloud-ready infrastructure
- 📱 Responsive design
- ⚡ Performance optimized

### **Next Steps**
1. **Deploy to production** using the provided configurations
2. **Monitor performance** and user feedback
3. **Iterate and improve** based on real-world usage
4. **Scale infrastructure** as user base grows
5. **Add new features** based on user needs

Your platform is now ready to compete with commercial music streaming services and provide artists and listeners with a powerful, feature-rich experience!
