"use strict";
/**
 * Analytics API
 * Handles usage tracking, metrics, and analytics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnalyticsApp = void 0;
const hono_1 = require("hono");
const firebase_functions_1 = require("firebase-functions");
const config_1 = require("../config");
const hono_auth_1 = require("../middleware/hono-auth");
const hono_cors_1 = require("../middleware/hono-cors");
const response_1 = require("../utils/response");
const createAnalyticsApp = () => {
    const app = new hono_1.Hono();
    // Apply middleware
    app.use('*', hono_cors_1.corsMiddleware);
    /**
     * Health check endpoint
     */
    app.get('/health', (c) => {
        return c.json({
            success: true,
            service: 'analytics',
            status: 'healthy',
            timestamp: new Date().toISOString()
        });
    });
    /**
     * GET /user-stats
     * Get user analytics and statistics
     */
    app.get('/user-stats', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            // Get user's applications count
            const appsSnapshot = await config_1.db.collection('applications')
                .where('createdBy', '==', user.uid)
                .get();
            // Get user's generations count
            const generationsSnapshot = await config_1.db.collection('generations')
                .where('userId', '==', user.uid)
                .get();
            // Get user's files count
            const filesSnapshot = await config_1.db.collection('files')
                .where('uploadedBy', '==', user.uid)
                .get();
            // Calculate statistics
            const stats = {
                applications: {
                    total: appsSnapshot.docs.length,
                    byStatus: {},
                    byFramework: {},
                },
                generations: {
                    total: generationsSnapshot.docs.length,
                    successful: 0,
                    failed: 0,
                },
                files: {
                    total: filesSnapshot.docs.length,
                    totalSize: 0,
                },
                account: {
                    createdAt: user.email ? new Date() : null, // Placeholder
                    lastActive: new Date(),
                }
            };
            // Analyze applications
            appsSnapshot.docs.forEach(doc => {
                const app = doc.data();
                const status = app.status || 'unknown';
                const framework = app.framework || 'unknown';
                stats.applications.byStatus[status] = (stats.applications.byStatus[status] || 0) + 1;
                stats.applications.byFramework[framework] = (stats.applications.byFramework[framework] || 0) + 1;
            });
            // Analyze generations
            generationsSnapshot.docs.forEach(doc => {
                const generation = doc.data();
                if (generation.status === 'completed') {
                    stats.generations.successful++;
                }
                else if (generation.status === 'failed') {
                    stats.generations.failed++;
                }
            });
            // Analyze files
            filesSnapshot.docs.forEach(doc => {
                const file = doc.data();
                stats.files.totalSize += file.size || 0;
            });
            return c.json((0, response_1.createSuccessResponse)(stats));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to get user stats:', error);
            return c.json((0, response_1.createErrorResponse)('STATS_ERROR', 'Failed to get user statistics'), 500);
        }
    });
    /**
     * POST /track-event
     * Track analytics events
     */
    app.post('/track-event', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const { event, properties = {}, timestamp = new Date() } = body;
            if (!event) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Event name is required'), 400);
            }
            // Store analytics event
            const eventDoc = {
                userId: user.uid,
                event,
                properties,
                timestamp: new Date(timestamp),
                userAgent: c.req.header('user-agent') || '',
                ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '',
            };
            await config_1.db.collection('analytics_events').add(eventDoc);
            return c.json((0, response_1.createSuccessResponse)({ message: 'Event tracked successfully' }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to track event:', error);
            return c.json((0, response_1.createErrorResponse)('TRACKING_ERROR', 'Failed to track event'), 500);
        }
    });
    /**
     * GET /usage-metrics
     * Get detailed usage metrics
     */
    app.get('/usage-metrics', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const query = c.req.query();
            const timeRange = query.timeRange || '30d'; // 7d, 30d, 90d, 1y
            const endDate = new Date();
            const startDate = new Date();
            // Calculate start date based on time range
            switch (timeRange) {
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(endDate.getDate() - 90);
                    break;
                case '1y':
                    startDate.setFullYear(endDate.getFullYear() - 1);
                    break;
                default:
                    startDate.setDate(endDate.getDate() - 30);
            }
            // Get analytics events for the time range
            const eventsSnapshot = await config_1.db.collection('analytics_events')
                .where('userId', '==', user.uid)
                .where('timestamp', '>=', startDate)
                .where('timestamp', '<=', endDate)
                .orderBy('timestamp', 'desc')
                .get();
            const events = eventsSnapshot.docs.map(doc => doc.data());
            // Aggregate metrics
            const metrics = {
                totalEvents: events.length,
                eventTypes: {},
                dailyActivity: {},
                topEvents: [],
            };
            // Count events by type
            events.forEach(event => {
                const eventName = event.event;
                metrics.eventTypes[eventName] = (metrics.eventTypes[eventName] || 0) + 1;
                // Daily activity
                const dateKey = event.timestamp.toDate().toISOString().split('T')[0];
                metrics.dailyActivity[dateKey] = (metrics.dailyActivity[dateKey] || 0) + 1;
            });
            // Get top events
            metrics.topEvents = Object.entries(metrics.eventTypes)
                .map(([event, count]) => ({ event, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
            return c.json((0, response_1.createSuccessResponse)(metrics));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to get usage metrics:', error);
            return c.json((0, response_1.createErrorResponse)('METRICS_ERROR', 'Failed to get usage metrics'), 500);
        }
    });
    return app;
};
exports.createAnalyticsApp = createAnalyticsApp;
//# sourceMappingURL=analytics.js.map