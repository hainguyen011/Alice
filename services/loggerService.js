import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LoggerService {
    constructor() {
        this.logBuffer = [];
        this.maxBufferSize = 100;
        this.clients = new Set();

        const logFormat = winston.format.printf(({ timestamp, level, message, source, metadata }) => {
            return `[${timestamp}] [${level.toUpperCase()}] [${source || 'SYSTEM'}] ${message} ${metadata ? JSON.stringify(metadata) : ''}`;
        });

        this.logger = winston.createLogger({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logFormat
            ),
            transports: [
                new winston.transports.Console(),
                new DailyRotateFile({
                    filename: path.join(__dirname, '../logs/system-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxFiles: '14d',
                    level: 'info'
                })
            ]
        });
    }

    /**
     * Core log method
     * @param {string} level - info, error, warn, ai, system
     * @param {string} message - The log message
     * @param {string} source - The source (e.g., system, botId)
     * @param {object} metadata - Extra data
     */
    log(level, message, source = 'system', metadata = null) {
        const logEntry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            level,
            message,
            source,
            metadata
        };

        // 1. Log to Winston (Console & File)
        this.logger.log(level === 'ai' || level === 'system' ? 'info' : level, message, { source, metadata });

        // 2. Add to Memory Buffer
        this.logBuffer.push(logEntry);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }

        // 3. Broadcast to SSE clients
        this.broadcast(logEntry);
    }

    // Helper methods
    info(message, source, metadata) { this.log('info', message, source, metadata); }
    error(message, source, metadata) { this.log('error', message, source, metadata); }
    warn(message, source, metadata) { this.log('warn', message, source, metadata); }
    ai(message, source, metadata) { this.log('ai', message, source, metadata); }
    system(message, source, metadata) { this.log('system', message, source, metadata); }

    /**
     * SSE Handlers
     */
    addClient(res) {
        this.clients.add(res);

        // Push buffer to new client
        res.write(`data: ${JSON.stringify({ type: 'buffer', logs: this.logBuffer })}\n\n`);
    }

    removeClient(res) {
        this.clients.delete(res);
    }

    broadcast(logEntry) {
        const data = JSON.stringify({ type: 'log', log: logEntry });
        this.clients.forEach(res => res.write(`data: ${data}\n\n`));
    }

    /**
     * SSE Route Middleware
     */
    handleSSE(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        this.addClient(res);

        req.on('close', () => {
            this.removeClient(res);
        });
    }
}

export const logger = new LoggerService();
export default logger;
