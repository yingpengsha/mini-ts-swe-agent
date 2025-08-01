import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private level: LogLevel;
  private name: string;

  constructor(name: string, level: LogLevel = LogLevel.INFO) {
    this.name = name;
    this.level = level;
  }

  private log(level: LogLevel, message: string, ...args: unknown[]) {
    if (level < this.level) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const prefix = `[${timestamp}] [${this.name}] [${levelName}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.log(chalk.gray(prefix), message, ...args);
        break;
      case LogLevel.INFO:
        console.log(chalk.blue(prefix), message, ...args);
        break;
      case LogLevel.WARN:
        console.log(chalk.yellow(prefix), message, ...args);
        break;
      case LogLevel.ERROR:
        console.error(chalk.red(prefix), message, ...args);
        break;
    }
  }

  debug(message: string, ...args: unknown[]) {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: unknown[]) {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: unknown[]) {
    this.log(LogLevel.ERROR, message, ...args);
  }
}