import { BaseService } from './BaseService';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// Real-time session types
export interface RealtimeSession {
  id: string;
  appId: string;
  owner: string;
  participants: {
    [userId: string]: {
      name: string;
      email: string;
      mode: 'edit' | 'view';
      lastSeen: Date;
      cursor?: {
        fileId: string;
        position: { line: number; column: number };
      };
    };
  };
  files: {
    [fileId: string]: {
      id: string;
      path: string;
      content: string;
      language: string;
      lastModified: Date;
      lastModifiedBy: string;
      locks: {
        [userId: string]: {
          startLine: number;
          endLine: number;
          timestamp: Date;
        };
      };
    };
  };
  chat: RealtimeMessage[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'ended';
}

export interface RealtimeMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  type: 'chat' | 'system' | 'notification';
  timestamp: Date;
}

export interface UpdateFileData {
  fileId: string;
  content: string;
  path: string;
  language: string;
  cursorPosition?: { line: number; column: number };
}

/**
 * Real-time Service
 * Handles real-time collaboration using Firebase Realtime Database
 */
export class RealtimeService extends BaseService {
  private rtdb: any;
  protected db: any;

  constructor() {
    super();
    this.rtdb = getDatabase();
    this.db = getFirestore();
  }

  /**
   * Join or create a real-time editing session
   */
  async joinSession(
    userId: string, 
    appId: string, 
    mode: 'edit' | 'view'
  ): Promise<{ sessionId: string; session: RealtimeSession }> {
    try {
      // Check if user has access to the app
      const appDoc = await this.db.collection('applications').doc(appId).get();
      if (!appDoc.exists) {
        throw new Error('Application not found');
      }

      const app = appDoc.data();
      const canEdit = app.createdBy === userId || app.isPublic;
      const actualMode = canEdit ? mode : 'view';

      // Get user info
      const userDoc = await this.db.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      // Create or get existing session
      const sessionId = `session_${appId}`;
      const sessionRef = this.rtdb.ref(`sessions/${sessionId}`);
      
      const sessionSnapshot = await sessionRef.once('value');
      let session: RealtimeSession;

      if (sessionSnapshot.exists()) {
        // Join existing session
        session = sessionSnapshot.val();
        
        // Add participant
        await sessionRef.child(`participants/${userId}`).set({
          name: userData.displayName || userData.email || 'Anonymous',
          email: userData.email || '',
          mode: actualMode,
          lastSeen: new Date().toISOString(),
        });

        // Update session status
        await sessionRef.child('updatedAt').set(new Date().toISOString());
        await sessionRef.child('status').set('active');
      } else {
        // Create new session
        const now = new Date();
        session = {
          id: sessionId,
          appId,
          owner: userId,
          participants: {
            [userId]: {
              name: userData.displayName || userData.email || 'Anonymous',
              email: userData.email || '',
              mode: actualMode,
              lastSeen: now,
            }
          },
          files: {},
          chat: [],
          createdAt: now,
          updatedAt: now,
          status: 'active',
        };

        // Load app files into session
        const filesSnapshot = await this.db.collection('applications')
          .doc(appId)
          .collection('files')
          .get();

        if (!filesSnapshot.empty) {
          filesSnapshot.forEach(doc => {
            const fileData = doc.data();
            session.files[doc.id] = {
              id: doc.id,
              path: fileData.path,
              content: fileData.content,
              language: fileData.language,
              lastModified: new Date(),
              lastModifiedBy: userId,
              locks: {},
            };
          });
        }

        await sessionRef.set(session);
      }

      this.logger.info('User joined session', { sessionId, userId, mode: actualMode });
      
      return { sessionId, session };
    } catch (error) {
      this.logger.error('Failed to join session', { userId, appId, error });
      throw new Error('Failed to join session');
    }
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string, userId: string): Promise<RealtimeSession | null> {
    try {
      const sessionRef = this.rtdb.ref(`sessions/${sessionId}`);
      const snapshot = await sessionRef.once('value');
      
      if (!snapshot.exists()) {
        return null;
      }

      const session = snapshot.val();
      
      // Check if user has access
      if (!session.participants[userId] && session.owner !== userId) {
        throw new Error('Access denied to session');
      }

      return session;
    } catch (error) {
      this.logger.error('Failed to get session', { sessionId, userId, error });
      throw new Error('Failed to get session');
    }
  }

  /**
   * Update file content in real-time
   */
  async updateFile(
    sessionId: string, 
    userId: string, 
    fileData: UpdateFileData
  ): Promise<void> {
    try {
      const sessionRef = this.rtdb.ref(`sessions/${sessionId}`);
      const session = await this.getSession(sessionId, userId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      // Check if user has edit permissions
      const participant = session.participants[userId];
      if (!participant || participant.mode !== 'edit') {
        throw new Error('No edit permissions');
      }

      // Update file in real-time database
      const updates: any = {
        [`files/${fileData.fileId}/content`]: fileData.content,
        [`files/${fileData.fileId}/lastModified`]: new Date().toISOString(),
        [`files/${fileData.fileId}/lastModifiedBy`]: userId,
        [`participants/${userId}/lastSeen`]: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update cursor position if provided
      if (fileData.cursorPosition) {
        updates[`participants/${userId}/cursor`] = {
          fileId: fileData.fileId,
          position: fileData.cursorPosition,
        };
      }

      await sessionRef.update(updates);

      // Also persist to Firestore for permanent storage
      await this.db.collection('applications')
        .doc(session.appId)
        .collection('files')
        .doc(fileData.fileId)
        .update({
          content: fileData.content,
          lastModified: new Date(),
          lastModifiedBy: userId,
        });

      this.logger.info('File updated in real-time', { sessionId, userId, fileId: fileData.fileId });
    } catch (error) {
      this.logger.error('Failed to update file', { sessionId, userId, error });
      throw new Error('Failed to update file');
    }
  }

  /**
   * Send message in real-time chat
   */
  async sendMessage(
    sessionId: string, 
    userId: string, 
    message: string, 
    type: 'chat' | 'system' | 'notification'
  ): Promise<RealtimeMessage> {
    try {
      const session = await this.getSession(sessionId, userId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      const participant = session.participants[userId];
      const messageData: RealtimeMessage = {
        id: `msg_${Date.now()}_${userId}`,
        userId,
        userName: participant?.name || 'Anonymous',
        message,
        type,
        timestamp: new Date(),
      };

      // Add message to chat
      const sessionRef = this.rtdb.ref(`sessions/${sessionId}`);
      await sessionRef.child('chat').push(messageData);
      
      // Update participant last seen
      await sessionRef.child(`participants/${userId}/lastSeen`).set(new Date().toISOString());

      this.logger.info('Message sent', { sessionId, userId, type });
      
      return messageData;
    } catch (error) {
      this.logger.error('Failed to send message', { sessionId, userId, error });
      throw new Error('Failed to send message');
    }
  }

  /**
   * Get chat messages
   */
  async getMessages(
    sessionId: string, 
    userId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<{ messages: RealtimeMessage[]; total: number }> {
    try {
      const session = await this.getSession(sessionId, userId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      const messages = session.chat || [];
      const sortedMessages = messages
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(offset, offset + limit);

      return {
        messages: sortedMessages,
        total: messages.length,
      };
    } catch (error) {
      this.logger.error('Failed to get messages', { sessionId, userId, error });
      throw new Error('Failed to get messages');
    }
  }

  /**
   * Update cursor position
   */
  async updateCursor(
    sessionId: string, 
    userId: string, 
    fileId: string, 
    position: { line: number; column: number }
  ): Promise<void> {
    try {
      const sessionRef = this.rtdb.ref(`sessions/${sessionId}`);
      
      await sessionRef.update({
        [`participants/${userId}/cursor`]: {
          fileId,
          position,
        },
        [`participants/${userId}/lastSeen`]: new Date().toISOString(),
      });

      this.logger.info('Cursor updated', { sessionId, userId, fileId });
    } catch (error) {
      this.logger.error('Failed to update cursor', { sessionId, userId, error });
      throw new Error('Failed to update cursor');
    }
  }

  /**
   * Leave session
   */
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    try {
      const sessionRef = this.rtdb.ref(`sessions/${sessionId}`);
      
      // Remove participant
      await sessionRef.child(`participants/${userId}`).remove();
      
      // Check if session is empty
      const snapshot = await sessionRef.child('participants').once('value');
      if (!snapshot.exists() || Object.keys(snapshot.val()).length === 0) {
        // Mark session as inactive
        await sessionRef.update({
          status: 'inactive',
          updatedAt: new Date().toISOString(),
        });
      }

      this.logger.info('User left session', { sessionId, userId });
    } catch (error) {
      this.logger.error('Failed to leave session', { sessionId, userId, error });
      throw new Error('Failed to leave session');
    }
  }

  /**
   * Clean up inactive sessions (should be called periodically)
   */
  async cleanupInactiveSessions(): Promise<void> {
    try {
      const sessionsRef = this.rtdb.ref('sessions');
      const snapshot = await sessionsRef.once('value');
      
      if (!snapshot.exists()) {
        return;
      }

      const sessions = snapshot.val();
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      for (const sessionId in sessions) {
        const session = sessions[sessionId];
        const lastUpdate = new Date(session.updatedAt);
        
        if (lastUpdate < cutoffTime && session.status === 'inactive') {
          await sessionsRef.child(sessionId).remove();
          this.logger.info('Cleaned up inactive session', { sessionId });
        }
      }
    } catch (error) {
      this.logger.error('Failed to cleanup sessions', { error });
    }
  }
}