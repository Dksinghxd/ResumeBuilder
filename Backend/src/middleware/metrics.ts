import { Request, Response } from 'express';

/**
 * Prometheus metrics middleware
 * Exposes application metrics in Prometheus format
 */

interface MetricData {
  httpRequestsTotal: Map<string, number>;
  httpRequestDurationSeconds: Map<string, number[]>;
  httpRequestErrors: Map<string, number>;
  customMetrics: Map<string, number>;
}

const metrics: MetricData = {
  httpRequestsTotal: new Map(),
  httpRequestDurationSeconds: new Map(),
  httpRequestErrors: new Map(),
  customMetrics: new Map(),
};

export const initMetrics = () => {
  // Initialize some common metrics
  metrics.httpRequestsTotal.set('total', 0);
};

export const recordHttpRequest = (method: string, path: string, statusCode: number, duration: number) => {
  // Record total requests
  const total = (metrics.httpRequestsTotal.get('total') || 0) + 1;
  metrics.httpRequestsTotal.set('total', total);

  // Record by endpoint
  const key = `${method}_${path}`;
  const count = (metrics.httpRequestsTotal.get(key) || 0) + 1;
  metrics.httpRequestsTotal.set(key, count);

  // Record duration
  const durations = metrics.httpRequestDurationSeconds.get(key) || [];
  durations.push(duration / 1000); // Convert to seconds
  metrics.httpRequestDurationSeconds.set(key, durations);

  // Record errors
  if (statusCode >= 400) {
    const errorKey = `${statusCode}_${method}_${path}`;
    const errorCount = (metrics.httpRequestErrors.get(errorKey) || 0) + 1;
    metrics.httpRequestErrors.set(errorKey, errorCount);
  }
};

export const recordCustomMetric = (name: string, value: number) => {
  metrics.customMetrics.set(name, value);
};

/**
 * Format metrics in Prometheus text format
 */
function formatPrometheus(): string {
  let output = '';

  // HTTP requests total
  output += '# HELP http_requests_total Total HTTP requests\n';
  output += '# TYPE http_requests_total counter\n';
  metrics.httpRequestsTotal.forEach((value, key) => {
    output += `http_requests_total{endpoint="${key}"} ${value}\n`;
  });

  // HTTP request errors
  output += '\n# HELP http_request_errors Total HTTP request errors\n';
  output += '# TYPE http_request_errors counter\n';
  metrics.httpRequestErrors.forEach((value, key) => {
    output += `http_request_errors{endpoint="${key}"} ${value}\n`;
  });

  // HTTP request duration (p50, p95, p99)
  output += '\n# HELP http_request_duration_seconds HTTP request duration\n';
  output += '# TYPE http_request_duration_seconds histogram\n';
  metrics.httpRequestDurationSeconds.forEach((durations, key) => {
    if (durations.length > 0) {
      const sorted = [...durations].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;

      output += `http_request_duration_seconds{endpoint="${key}",quantile="0.5"} ${p50}\n`;
      output += `http_request_duration_seconds{endpoint="${key}",quantile="0.95"} ${p95}\n`;
      output += `http_request_duration_seconds{endpoint="${key}",quantile="0.99"} ${p99}\n`;
      output += `http_request_duration_seconds{endpoint="${key}",quantile="avg"} ${avg}\n`;
    }
  });

  // Custom metrics
  output += '\n# HELP app_custom_metrics Custom application metrics\n';
  output += '# TYPE app_custom_metrics gauge\n';
  metrics.customMetrics.forEach((value, key) => {
    output += `app_custom_metrics{name="${key}"} ${value}\n`;
  });

  return output;
}

/**
 * Express route handler for /metrics endpoint
 */
export const metricsHandler = (_req: Request, res: Response) => {
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(formatPrometheus());
};
