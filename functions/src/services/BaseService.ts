import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

/**
 * Base service class providing common functionality for all services
 */
export abstract class BaseService {
  protected db: Firestore;
  protected logger: typeof logger;

  constructor() {
    this.db = getFirestore();
    this.logger = logger;
  }

  /**
   * Generate unique ID for documents
   */
  protected generateId(): string {
    return this.db.collection('_tmp').doc().id;
  }

  /**
   * Get current timestamp
   */
  protected now(): Timestamp {
    return Timestamp.now();
  }

  /**
   * Handle service errors with consistent logging
   */
  protected handleError(error: unknown, operation: string): never {
    this.logger.error(`Error in ${this.constructor.name}.${operation}:`, error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`Unknown error in ${operation}`);
  }
}
