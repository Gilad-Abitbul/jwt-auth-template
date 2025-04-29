/**
 * @file logger.ts
 * @description
 * This module sets up a centralized logger using the Winston logging library.
 * It defines the log format and the destination file for logging messages.
 *
 * Features:
 * - Logs all messages with a minimum level of 'info'.
 * - Includes a timestamp for each log entry.
 * - Formats logs as '[timestamp] [LEVEL]: message'.
 * - Saves logs to a 'rate-limit.log' file inside the 'logs' directory.
 *
 * Dependencies:
 * - Winston for structured logging.
 * - Path for cross-platform file path management.
 *
 * Usage:
 * - Import the logger and use logger.info(), logger.error(), etc.
 *
 */
import { createLogger, format, transports } from 'winston';
import path from 'path';

/**
 * Creates and configures a Winston logger instance.
 *
 * The logger:
 * - Captures all logs with a severity of 'info' or higher.
 * - Appends a timestamp to each log entry.
 * - Formats log entries in the style: '[timestamp] [LEVEL]: message'.
 * - Outputs logs to a file located at 'logs/rate-limit.log' relative to the project root.
 *
 * @returns {Logger} A configured Winston logger instance ready for use.
 */
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
  ),
  transports: [
    new transports.File({ filename: path.join(__dirname, '..', 'logs', 'rate-limit.log') })
  ],
});

export default logger;