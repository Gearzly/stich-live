import { Context } from 'hono';
export declare class AppsController {
    private appService;
    constructor();
    /**
     * Creates a new application
     */
    createApp(c: Context): Promise<Response>;
    /**
     * Retrieves user's applications with pagination
     */
    getUserApps(c: Context): Promise<Response>;
    /**
     * Retrieves a specific application by ID
     */
    getAppById(c: Context): Promise<Response>;
    /**
     * Updates an existing application
     */
    updateApp(c: Context): Promise<Response>;
    /**
     * Deletes an application
     */
    deleteApp(c: Context): Promise<Response>;
    /**
     * Updates application status
     */
    updateAppStatus(c: Context): Promise<Response>;
    /**
     * Updates application metadata
     */
    updateAppMetadata(c: Context): Promise<Response>;
    /**
     * Retrieves public applications
     */
    getPublicApps(c: Context): Promise<Response>;
    /**
     * Standardized error handling for controller methods
     */
    private handleControllerError;
}
//# sourceMappingURL=controller-new.d.ts.map