"use strict";
/**
 * Firebase Storage Triggers
 * Handles file upload and storage events
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onFileDeleted = exports.onFileUploaded = void 0;
const storage_1 = require("firebase-functions/v2/storage");
const v2_1 = require("firebase-functions/v2");
const firestore_1 = require("firebase-admin/firestore");
const storage_2 = require("firebase-admin/storage");
const db = (0, firestore_1.getFirestore)();
const storage = (0, storage_2.getStorage)();
/**
 * Trigger when a file is uploaded to Firebase Storage
 * Handles file processing and metadata creation
 */
exports.onFileUploaded = (0, storage_1.onObjectFinalized)(async (event) => {
    try {
        const object = event.data;
        const filePath = object.name;
        const bucket = storage.bucket(object.bucket);
        if (!filePath) {
            v2_1.logger.warn('File upload event without file path');
            return;
        }
        v2_1.logger.info(`File uploaded: ${filePath}`, {
            size: object.size,
            contentType: object.contentType
        });
        // Parse file path to extract metadata
        const pathParts = filePath.split('/');
        // Handle generated app files: /generated-apps/{appId}/{fileName}
        if (pathParts[0] === 'generated-apps' && pathParts.length >= 3) {
            const appId = pathParts[1];
            const fileName = pathParts.slice(2).join('/');
            // Update app record with file information
            const appRef = db.collection('apps').doc(appId);
            const appDoc = await appRef.get();
            if (appDoc.exists) {
                // Get download URL
                const file = bucket.file(filePath);
                const [url] = await file.getSignedUrl({
                    action: 'read',
                    expires: '03-09-2491' // Far future date
                });
                // Update app files array
                await appRef.update({
                    files: firestore_1.FieldValue.arrayUnion({
                        name: fileName,
                        path: filePath,
                        url,
                        size: typeof object.size === 'string' ? parseInt(object.size) : object.size || 0,
                        contentType: object.contentType,
                        uploadedAt: new Date()
                    }),
                    updatedAt: new Date()
                });
                v2_1.logger.info(`File added to app: ${appId}`, { fileName });
            }
        }
        // Handle user uploads: /user-uploads/{userId}/{fileName}
        if (pathParts[0] === 'user-uploads' && pathParts.length >= 3) {
            const userId = pathParts[1];
            const fileName = pathParts.slice(2).join('/');
            // Create file record
            await db.collection('user_files').add({
                userId,
                fileName,
                filePath,
                size: typeof object.size === 'string' ? parseInt(object.size) : object.size || 0,
                contentType: object.contentType,
                uploadedAt: new Date()
            });
            v2_1.logger.info(`User file uploaded: ${userId}`, { fileName });
        }
        // Handle profile pictures: /profile-pictures/{userId}/{fileName}
        if (pathParts[0] === 'profile-pictures' && pathParts.length >= 3) {
            const userId = pathParts[1];
            // Get download URL
            const file = bucket.file(filePath);
            const [url] = await file.getSignedUrl({
                action: 'read',
                expires: '03-09-2491'
            });
            // Update user profile
            await db.collection('users').doc(userId).update({
                profilePicture: url,
                updatedAt: new Date()
            });
            v2_1.logger.info(`Profile picture updated: ${userId}`);
        }
    }
    catch (error) {
        v2_1.logger.error('Error in onFileUploaded:', error);
    }
});
/**
 * Trigger when a file is deleted from Firebase Storage
 * Handles cleanup and metadata updates
 */
exports.onFileDeleted = (0, storage_1.onObjectDeleted)(async (event) => {
    try {
        const object = event.data;
        const filePath = object.name;
        if (!filePath) {
            return;
        }
        v2_1.logger.info(`File deleted: ${filePath}`);
        const pathParts = filePath.split('/');
        // Handle generated app file deletion
        if (pathParts[0] === 'generated-apps' && pathParts.length >= 3) {
            const appId = pathParts[1];
            const fileName = pathParts.slice(2).join('/');
            // Remove file from app record
            const appRef = db.collection('apps').doc(appId);
            const appDoc = await appRef.get();
            if (appDoc.exists) {
                const appData = appDoc.data();
                const files = (appData === null || appData === void 0 ? void 0 : appData.files) || [];
                // Filter out the deleted file
                const updatedFiles = files.filter((file) => file.path !== filePath);
                await appRef.update({
                    files: updatedFiles,
                    updatedAt: new Date()
                });
                v2_1.logger.info(`File removed from app: ${appId}`, { fileName });
            }
        }
        // Handle user file deletion
        if (pathParts[0] === 'user-uploads' && pathParts.length >= 3) {
            // Remove file record
            const fileQuery = db.collection('user_files').where('filePath', '==', filePath);
            const fileSnapshot = await fileQuery.get();
            if (!fileSnapshot.empty) {
                const batch = db.batch();
                fileSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                v2_1.logger.info(`User file record deleted: ${filePath}`);
            }
        }
        // Handle profile picture deletion
        if (pathParts[0] === 'profile-pictures' && pathParts.length >= 3) {
            const userId = pathParts[1];
            // Clear profile picture URL
            await db.collection('users').doc(userId).update({
                profilePicture: null,
                updatedAt: new Date()
            });
            v2_1.logger.info(`Profile picture cleared: ${userId}`);
        }
    }
    catch (error) {
        v2_1.logger.error('Error in onFileDeleted:', error);
    }
});
//# sourceMappingURL=index.js.map