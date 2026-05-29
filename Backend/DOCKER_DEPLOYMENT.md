# Resume Builder Backend - Docker Deployment Guide

## Quick Start with Docker

### Prerequisites
- Docker installed
- Docker Compose installed

### Development Environment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Service URLs
- Backend API: http://localhost:5000
- MongoDB: mongodb://localhost:27017
- MongoDB UI (optional): http://localhost:8081

---

## Production Deployment

### Building for Production

```bash
# Build the TypeScript code first
npm run build

# Build Docker image
docker build -t resume-builder-api:1.0.0 .

# Test locally
docker run -p 5000:5000 \
  -e MONGODB_URI="mongodb://..." \
  -e JWT_SECRET="your-secret" \
  resume-builder-api:1.0.0
```

### Environment Variables for Docker

Create `.env.production`:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/resume-builder
JWT_SECRET=strong-production-secret-key
JWT_REFRESH_SECRET=strong-refresh-secret-key
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Docker Compose Override for Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: resume-builder-api:1.0.0
    container_name: resume-builder-api-prod
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      MONGODB_URI: ${MONGODB_URI}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 40s
    # Remove mongodb service for production (use managed MongoDB)
```

Run production:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Kubernetes Deployment (Advanced)

### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: resume-builder-api
  labels:
    app: resume-builder-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: resume-builder-api
  template:
    metadata:
      labels:
        app: resume-builder-api
    spec:
      containers:
      - name: api
        image: resume-builder-api:1.0.0
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: resume-builder-secrets
              key: mongodb-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: resume-builder-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: resume-builder-api-service
spec:
  selector:
    app: resume-builder-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
```

### Deploy to Kubernetes

```bash
# Create secrets
kubectl create secret generic resume-builder-secrets \
  --from-literal=mongodb-uri="mongodb+srv://..." \
  --from-literal=jwt-secret="your-secret"

# Deploy
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Check status
kubectl get deployments
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/resume-builder-api
```

---

## AWS Deployment Options

### Option 1: AWS Elastic Container Service (ECS)

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker tag resume-builder-api:1.0.0 123456789.dkr.ecr.us-east-1.amazonaws.com/resume-builder-api:1.0.0

docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/resume-builder-api:1.0.0
```

### Option 2: AWS Elastic Beanstalk

```bash
# Initialize Elastic Beanstalk
eb init -p docker resume-builder-api

# Create environment
eb create resume-builder-prod

# Deploy
eb deploy

# Monitor
eb logs
```

### Option 3: AWS App Runner

```bash
# Deploy directly from source
aws apprunner create-service \
  --service-name resume-builder-api \
  --source-configuration "RepositoryType=GITHUB,ImageRepository=true"
```

---

## Azure Deployment

### Azure Container Instances

```bash
# Create resource group
az group create --name resume-builder --location eastus

# Create container instance
az container create \
  --resource-group resume-builder \
  --name resume-builder-api \
  --image resume-builder-api:1.0.0 \
  --ports 5000 \
  --environment-variables \
    NODE_ENV=production \
    MONGODB_URI="mongodb+srv://..." \
  --restart-policy Always
```

### Azure App Service (Containerized)

```bash
# Create App Service Plan
az appservice plan create \
  --name resume-builder-plan \
  --resource-group resume-builder \
  --sku B2 \
  --is-linux

# Create Web App
az webapp create \
  --name resume-builder-api \
  --resource-group resume-builder \
  --plan resume-builder-plan \
  --deployment-container-image-name resume-builder-api:1.0.0

# Set environment variables
az webapp config appsettings set \
  --resource-group resume-builder \
  --name resume-builder-api \
  --settings NODE_ENV=production MONGODB_URI="mongodb+srv://..."
```

---

## Monitoring & Logging

### Docker Logs

```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f backend

# Show last 100 lines
docker-compose logs --tail=100 backend
```

### Container Health

```bash
# Check container status
docker ps

# Inspect container
docker inspect resume-builder-api

# View resource usage
docker stats
```

---

## Scaling

### Docker Compose Scaling

```bash
# Scale service to 3 instances
docker-compose up -d --scale backend=3
```

### Load Balancing

Use Nginx or HAProxy to distribute traffic:

```nginx
upstream backend {
    server backend_1:5000;
    server backend_2:5000;
    server backend_3:5000;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Maintenance

### Backup Database

```bash
# Backup MongoDB
docker exec resume-builder-db mongodump --out /data/backup

# Restore MongoDB
docker exec resume-builder-db mongorestore /data/backup
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild image
docker build -t resume-builder-api:1.1.0 .

# Stop old container
docker-compose down

# Start new container
docker-compose up -d
```

### Clean Up

```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything
docker system prune -a
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Verify image
docker images

# Test locally
docker run -it resume-builder-api:1.0.0 node dist/index.js
```

### MongoDB connection failed

```bash
# Check MongoDB is running
docker ps | grep mongodb

# Test connection
docker exec resume-builder-db mongosh
```

### Port already in use

```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port in docker-compose.yml
```

---

## Performance Optimization

### Docker Image Optimization

```dockerfile
# Use multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

### Resource Limits

Set memory and CPU limits in docker-compose.yml:

```yaml
services:
  backend:
    ...
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

---

## Security Checklist

- [ ] Use strong JWT secrets
- [ ] Set CORS properly for production
- [ ] Use HTTPS/TLS
- [ ] Keep Docker images updated
- [ ] Use private registry for images
- [ ] Scan images for vulnerabilities
- [ ] Set proper file permissions
- [ ] Use secrets management
- [ ] Enable authentication
- [ ] Set up firewall rules

---

For more information, see the main [README.md](./README.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).
