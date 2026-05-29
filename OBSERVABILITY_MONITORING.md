# Observability & Monitoring Guide

This guide outlines the observability stack and provides configuration for monitoring your Resume Builder application.

## Three Pillars of Observability

### 1. Logging
**Current Status:** ✅ File-based structured logging
**What's Collected:**
- Request/response data with unique request IDs
- Audit logs for sensitive operations (CREATE, UPDATE, DELETE)
- Error logs with stack traces
- Application lifecycle events

**Logs Location:**
- Local: `Backend/logs/` (date-based files)
- Production: Should be shipped to centralized store

### 2. Metrics
**Current Status:** ✅ Prometheus-compatible `/metrics` endpoint
**What's Exposed:**
- HTTP request count (total, by endpoint)
- HTTP request errors (by status code)
- HTTP request latency (p50, p95, p99)
- Custom application metrics

**Endpoint:** `http://localhost:5000/metrics`

### 3. Tracing
**Current Status:** ⚠️ Partial (request IDs are generated)
**Missing:** Distributed tracing across services
**Solution:** Implement OpenTelemetry (see roadmap below)

---

## Prometheus Configuration

### 1. Add Prometheus Service to docker-compose

Add this to your `docker-compose.yml`:

```yaml
prometheus:
  image: prom/prometheus:latest
  container_name: resume-prometheus
  restart: unless-stopped
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
    - prometheus_data:/prometheus
  ports:
    - "9090:9090"
  networks:
    - app_net
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'
```

### 2. Create `prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'resume-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongo:27017']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
```

---

## Grafana Dashboard Configuration

### 1. Add Grafana Service to docker-compose

```yaml
grafana:
  image: grafana/grafana:latest
  container_name: resume-grafana
  restart: unless-stopped
  ports:
    - "3001:3000"  # Use 3001 to avoid conflict with frontend
  environment:
    - GF_SECURITY_ADMIN_USER=admin
    - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin}
    - GF_USERS_ALLOW_SIGN_UP=false
  volumes:
    - grafana_data:/var/lib/grafana
    - ./grafana/provisioning:/etc/grafana/provisioning:ro
  depends_on:
    - prometheus
  networks:
    - app_net
```

### 2. Critical Dashboards to Create

#### Dashboard 1: Service Health Overview
```json
{
  "dashboard": {
    "title": "Resume Builder - Service Health",
    "panels": [
      {
        "title": "Backend Uptime",
        "targets": [
          {
            "expr": "up{job='resume-backend'}",
            "legendFormat": "Backend"
          }
        ]
      },
      {
        "title": "Request Rate (req/sec)",
        "targets": [
          {
            "expr": "rate(http_requests_total[1m])",
            "legendFormat": "{{ endpoint }}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_request_errors[1m])",
            "legendFormat": "{{ endpoint }}"
          }
        ]
      },
      {
        "title": "API Latency (p99)",
        "targets": [
          {
            "expr": "http_request_duration_seconds{quantile='0.99'}",
            "legendFormat": "{{ endpoint }}"
          }
        ]
      }
    ]
  }
}
```

#### Dashboard 2: Business Metrics
```json
{
  "dashboard": {
    "title": "Resume Builder - Business Metrics",
    "panels": [
      {
        "title": "Active Users (24h)",
        "targets": [
          {
            "expr": "count(increase(user_login_total[24h]))"
          }
        ]
      },
      {
        "title": "Resumes Created (24h)",
        "targets": [
          {
            "expr": "increase(resume_created_total[24h])"
          }
        ]
      },
      {
        "title": "Sign-ups (24h)",
        "targets": [
          {
            "expr": "increase(user_signup_total[24h])"
          }
        ]
      },
      {
        "title": "Export Events (24h)",
        "targets": [
          {
            "expr": "increase(resume_export_total[24h])"
          }
        ]
      }
    ]
  }
}
```

---

## Alert Rules (Prometheus AlertManager)

Create `alert-rules.yml`:

```yaml
groups:
  - name: resume-builder
    interval: 30s
    rules:
      - alert: ServiceDown
        expr: up{job='resume-backend'} == 0
        for: 1m
        annotations:
          summary: "Resume Builder backend is down"

      - alert: HighErrorRate
        expr: rate(http_request_errors[5m]) > 0.05
        for: 5m
        annotations:
          summary: "Error rate above 5%"

      - alert: HighLatency
        expr: http_request_duration_seconds{quantile='0.99'} > 1
        for: 5m
        annotations:
          summary: "API latency (p99) above 1 second"

      - alert: DatabaseDown
        expr: up{job='mongodb'} == 0
        for: 1m
        annotations:
          summary: "MongoDB is unreachable"

      - alert: LowDiskSpace
        expr: node_filesystem_avail_bytes < 1073741824
        for: 5m
        annotations:
          summary: "Less than 1GB disk space remaining"
```

---

## Logging Best Practices

### 1. Structured Logging Format

Current format (good):
```json
{
  "timestamp": "2026-05-23T10:30:00Z",
  "level": "info",
  "message": "API Request: POST /api/v1/auth/login",
  "requestId": "1683705000000-abc123def",
  "method": "POST",
  "path": "/api/v1/auth/login",
  "statusCode": 200,
  "duration": "125ms",
  "userId": "user-id-123",
  "ip": "192.168.1.100"
}
```

### 2. Log Aggregation Setup (ELK Stack)

For production, aggregate logs to ELK (Elasticsearch, Logstash, Kibana):

Add to `docker-compose.yml`:

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
  volumes:
    - elasticsearch_data:/usr/share/elasticsearch/data
  networks:
    - app_net

kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
  ports:
    - "5601:5601"
  environment:
    - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
  depends_on:
    - elasticsearch
  networks:
    - app_net

logstash:
  image: docker.elastic.co/logstash/logstash:8.0.0
  volumes:
    - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro
  ports:
    - "5000:5000"
  depends_on:
    - elasticsearch
  networks:
    - app_net
```

### 3. Log Levels

Use appropriate log levels:

- **DEBUG:** Detailed diagnostic info
- **INFO:** General informational messages (API requests, events)
- **WARN:** Warning messages (deprecated features, unusual but recoverable events)
- **ERROR:** Error messages (failures, exceptions)

### 4. What to Log

✅ **Do Log:**
- User actions (login, create resume, export)
- API requests/responses (with sanitized data)
- Database operations
- Errors and exceptions
- System events (startup, shutdown)
- Performance metrics

❌ **Don't Log:**
- Passwords or tokens
- Credit card numbers
- API keys
- Personal health information
- Unnecessary debug info in production

---

## Key Metrics to Track

### Application Metrics
- `http_requests_total` → Total API requests
- `http_request_errors` → Failed requests
- `http_request_duration_seconds` → API latency
- `user_login_total` → Login attempts/successes
- `resume_created_total` → Resumes created
- `resume_export_total` → Resume exports

### Database Metrics
- `mongodb_connections` → Active connections
- `mongodb_operations_total` → Total operations
- `mongodb_query_duration_seconds` → Query latency

### Infrastructure Metrics
- `node_cpu_usage` → CPU utilization
- `node_memory_usage` → Memory usage
- `node_disk_usage` → Disk utilization
- `container_network_io` → Network I/O

### Business Metrics
- User retention rate
- Feature adoption rate
- Error rate by feature
- Customer satisfaction score

---

## Alerting Strategy

### Alert Severities

1. **Critical** (immediate action required)
   - Service down
   - Database unreachable
   - Security breach detected
   - Disk space critical

2. **High** (urgent, but not immediate)
   - High error rate (> 5%)
   - Latency degradation (p99 > 1s)
   - Unusual traffic pattern

3. **Medium** (should address soon)
   - Deprecated API usage
   - Low disk space
   - Pending updates

4. **Low** (informational)
   - Deployment completed
   - Scheduled maintenance
   - Non-critical warnings

### Notification Channels

- **Critical:** PagerDuty, SMS, phone call
- **High:** Email, Slack, PagerDuty
- **Medium:** Slack
- **Low:** Email digest

---

## Next Steps

1. **Immediate (This Week):**
   - [ ] Add Prometheus scrape configuration
   - [ ] Set up Grafana with basic dashboards
   - [ ] Create alert rules
   - [ ] Test alert notifications

2. **Short-term (This Month):**
   - [ ] Implement log aggregation (ELK or Datadog)
   - [ ] Add custom business metrics to code
   - [ ] Create runbooks for common alerts
   - [ ] Set up on-call rotation

3. **Medium-term (This Quarter):**
   - [ ] Implement distributed tracing (OpenTelemetry)
   - [ ] Add APM (Application Performance Monitoring)
   - [ ] Set up synthetic monitoring (uptime checks)
   - [ ] Integrate with incident management system

---

## Tools & Services (Recommended)

### Open Source (Free)
- **Prometheus** → Metrics collection
- **Grafana** → Visualization
- **ELK Stack** → Log aggregation
- **Alertmanager** → Alert management

### Commercial (Freemium)
- **Datadog** → All-in-one observability
- **New Relic** → APM & infrastructure monitoring
- **Splunk** → Log aggregation & analysis
- **Sumo Logic** → Cloud-native monitoring

### Open Source SaaS
- **Grafana Cloud** → Hosted Grafana + Prometheus
- **InfluxDB Cloud** → Time-series database
