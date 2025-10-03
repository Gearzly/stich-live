import { Context } from 'hono';
export declare class UsersController {
    private userService;
    constructor();
    /**
     * Creates a new user (admin only)
     */
    createUser(c: Context): Promise<Response>;
    /**
     * Retrieves all users with pagination (admin only)
     */
    getUsers(c: Context): Promise<Response>;
    /**
     * Retrieves current user's profile
     */
    getCurrentUser(c: Context): Promise<Response>;
    /**
     * Retrieves a specific user by ID (admin only or own profile)
     */
    getUserById(c: Context): Promise<Response>;
    /**
     * Updates a user's profile
     */
    updateUser(c: Context): Promise<Response>;
    /**
     * Deletes a user (admin only)
     */
    deleteUser(c: Context): Promise<Response>;
    /**
     * Updates user preferences
     */
    updateUserPreferences(c: Context): Promise<Response>;
    /**
     * Retrieves user preferences
     */
    getUserPreferences(c: Context): Promise<Response>;
    /**
     * Standardized error handling for controller methods
     */
    private handleControllerError;
}
//# sourceMappingURL=controller.d.ts.map