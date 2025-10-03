import { HTTPException } from 'hono/http-exception';
import { config } from '../config/env';
export const errorHandler = (err, c) => {
    console.error('API Error:', {
        message: err.message,
        stack: err.stack,
        path: c.req.path,
        method: c.req.method,
        timestamp: new Date().toISOString(),
    });
    // Handle HTTPException from Hono
    if (err instanceof HTTPException) {
        return c.json({
            success: false,
            error: err.message,
            status: err.status,
            ...(config.NODE_ENV === 'development' && { stack: err.stack }),
        }, err.status);
    }
    const firebaseErr = err;
    // Handle Firebase Auth errors
    if (firebaseErr.code?.startsWith('auth/')) {
        const status = getFirebaseAuthErrorStatus(firebaseErr.code);
        return c.json({
            success: false,
            error: getFirebaseAuthErrorMessage(firebaseErr.code),
            code: firebaseErr.code,
            ...(config.NODE_ENV === 'development' && { stack: err.stack }),
        }, status);
    }
    // Handle Firestore errors
    if (firebaseErr.code && typeof firebaseErr.code === 'string') {
        const status = getFirestoreErrorStatus(firebaseErr.code);
        return c.json({
            success: false,
            error: err.message || 'Database operation failed',
            code: firebaseErr.code,
            ...(config.NODE_ENV === 'development' && { stack: err.stack }),
        }, status);
    }
    // Handle validation errors
    if (err.name === 'ZodError') {
        const validationErr = err;
        return c.json({
            success: false,
            error: 'Validation failed',
            details: validationErr.errors,
            ...(config.NODE_ENV === 'development' && { stack: err.stack }),
        }, 400);
    }
    // Generic error
    return c.json({
        success: false,
        error: 'Internal server error',
        ...(config.NODE_ENV === 'development' && {
            message: err.message,
            stack: err.stack,
        }),
    }, 500);
};
function getFirebaseAuthErrorStatus(code) {
    switch (code) {
        case 'auth/invalid-email':
        case 'auth/invalid-password':
        case 'auth/weak-password':
            return 400;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 401;
        case 'auth/email-already-in-use':
            return 409;
        case 'auth/too-many-requests':
            return 429;
        default:
            return 500;
    }
}
function getFirebaseAuthErrorMessage(code) {
    switch (code) {
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/invalid-password':
            return 'Invalid password';
        case 'auth/weak-password':
            return 'Password is too weak';
        case 'auth/user-not-found':
            return 'User not found';
        case 'auth/wrong-password':
            return 'Incorrect password';
        case 'auth/email-already-in-use':
            return 'Email address is already in use';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later';
        default:
            return 'Authentication error';
    }
}
function getFirestoreErrorStatus(code) {
    switch (code) {
        case 'permission-denied':
            return 403;
        case 'not-found':
            return 404;
        case 'already-exists':
            return 409;
        case 'resource-exhausted':
            return 429;
        case 'invalid-argument':
        case 'failed-precondition':
            return 400;
        default:
            return 500;
    }
}
//# sourceMappingURL=error-handler.js.map