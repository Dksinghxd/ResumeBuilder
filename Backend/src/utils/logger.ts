import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: Record<string, unknown>;
}

const logsDir = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  private getLogFile(level: string): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(logsDir, `${level}-${date}.log`);
  }

  private formatLog(level: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  private writeLog(level: string, message: string, data?: unknown): void {
    try {
      const logFile = this.getLogFile(level);
      const logEntry = this.formatLog(level, message, data);
      fs.appendFileSync(logFile, logEntry + '\n');

      // Also log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(logEntry);
      }
    } catch (error) {
      console.error('Logger error:', error);
    }
  }

  info(message: string, data?: unknown): void {
    this.writeLog('info', message, data);
  }

  error(message: string, data?: unknown): void {
    this.writeLog('error', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.writeLog('warn', message, data);
  }

  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV !== 'production') {
      this.writeLog('debug', message, data);
    }
  }
}

export default new Logger();
