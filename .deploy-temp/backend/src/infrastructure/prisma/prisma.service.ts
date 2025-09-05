// src/infrastructure/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000;

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: [
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    this.$on('error' as never, (e: any) => {
      this.logger.error('Database error:', e);
      this.handleConnectionError();
    });

    this.$on('warn' as never, (e: any) => {
      this.logger.warn('Database warning:', e);
    });
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.isConnected = false;
  }

  private async connect() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      this.handleConnectionError();
    }
  }

  private async handleConnectionError() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping reconnection.`);
      return;
    }

    this.isConnected = false;
    this.reconnectAttempts++;
    
    this.logger.log(`Attempting to reconnect to database (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(async () => {
      try {
        await this.$disconnect();
        await this.connect();
      } catch (error) {
        this.logger.error('Reconnection failed:', error);
        this.handleConnectionError();
      }
    }, this.reconnectDelay);
  }

  async executeWithRetry<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        if (!this.isConnected) {
          await this.connect();
        }
        return await operation();
      } catch (error: any) {
        this.logger.error(`Database operation failed (attempt ${i + 1}/${retries}):`, error);
        
        if (i === retries - 1) {
          throw error;
        }
        
        if (error.code === 'P2024' || error.code === 'P2025' || error.message?.includes('connection')) {
          await this.handleConnectionError();
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    throw new Error('Operation failed after all retries');
  }
}