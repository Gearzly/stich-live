import { Context } from 'hono';
export declare class AIController {
    private aiService;
    constructor();
    /**
     * Initiates code generation for an app
     */
    generateCode(c: Context): Promise<Response>;
    /**
     * Retrieves a generation session by ID
     */
    getGeneration(c: Context): Promise<Response>;
    /**
     * Updates generation session status
     */
    updateGenerationStatus(c: Context): Promise<Response>;
    /**
     * Retrieves user's generation history
     */
    getUserGenerations(c: Context): Promise<Response>;
    /**
     * Retrieves generation history for a specific app
     */
    getAppGenerations(c: Context): Promise<Response>;
    /**
     * Cancels a running generation session
     */
    cancelGeneration(c: Context): Promise<Response>;
    /**
     * Deletes a generation session
     */
    deleteGeneration(c: Context): Promise<Response>;
    /**
     * Retrieves AI usage statistics for the user
     */
    getUserAIStats(c: Context): Promise<Response>;
    /**
     * Standardized error handling for controller methods
     */
    private handleControllerError;
}
//# sourceMappingURL=controller-new.d.ts.map