"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
/**
 * Base service class providing common functionality for all services
 */
class BaseService {
    constructor() {
        this.db = (0, firestore_1.getFirestore)();
        this.logger = firebase_functions_1.logger;
    }
    /**
     * Generate unique ID for documents
     */
    generateId() {
        return this.db.collection('_tmp').doc().id;
    }
    /**
     * Get current timestamp
     */
    now() {
        return firestore_1.Timestamp.now();
    }
    /**
     * Handle service errors with consistent logging
     */
    handleError(error, operation) {
        this.logger.error(`Error in ${this.constructor.name}.${operation}:`, error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Unknown error in ${operation}`);
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=BaseService.js.map