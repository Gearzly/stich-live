import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  limit, 
  Timestamp,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Base service class for common Firebase operations
export abstract class BaseService {
  protected db = getFirestore();
  protected auth = getAuth();

  // Generic error handler
  protected handleError(error: unknown, operation: string): never {
    console.error(`Error in ${operation}:`, error);
    
    if (error instanceof Error) {
      throw new Error(`${operation} failed: ${error.message}`);
    }
    
    throw new Error(`${operation} failed: Unknown error`);
  }

  // Get current user ID
  protected getCurrentUserId(): string {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.uid;
  }

  // Convert Firestore timestamp to Date
  protected timestampToDate(timestamp: any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp?.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  // Add audit fields
  protected addAuditFields(data: any, isUpdate = false): any {
    const now = Timestamp.now();
    const userId = this.getCurrentUserId();

    if (isUpdate) {
      return {
        ...data,
        updatedAt: now,
        updatedBy: userId,
      };
    }

    return {
      ...data,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    };
  }

  // Generic CRUD operations
  protected async createDocument<T>(
    collectionName: string, 
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
  ): Promise<T & { id: string }> {
    try {
      const docData = this.addAuditFields(data);
      const docRef = await addDoc(collection(this.db, collectionName), docData);
      
      return {
        id: docRef.id,
        ...docData,
      } as T & { id: string };
    } catch (error) {
      this.handleError(error, `create ${collectionName}`);
    }
  }

  protected async getDocument<T>(
    collectionName: string, 
    id: string
  ): Promise<T | null> {
    try {
      const docRef = doc(this.db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: this.timestampToDate(data.createdAt),
        updatedAt: this.timestampToDate(data.updatedAt),
      } as T;
    } catch (error) {
      this.handleError(error, `get ${collectionName}`);
    }
  }

  protected async updateDocument<T>(
    collectionName: string, 
    id: string, 
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(this.db, collectionName, id);
      const updateData = this.addAuditFields(data, true);
      await updateDoc(docRef, updateData);
    } catch (error) {
      this.handleError(error, `update ${collectionName}`);
    }
  }

  protected async deleteDocument(
    collectionName: string, 
    id: string
  ): Promise<void> {
    try {
      const docRef = doc(this.db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      this.handleError(error, `delete ${collectionName}`);
    }
  }

  protected async queryDocuments<T>(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    try {
      const q = query(collection(this.db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: this.timestampToDate(data.createdAt),
          updatedAt: this.timestampToDate(data.updatedAt),
        };
      }) as T[];
    } catch (error) {
      this.handleError(error, `query ${collectionName}`);
    }
  }

  // Pagination helper
  protected async queryDocumentsWithPagination<T>(
    collectionName: string,
    constraints: QueryConstraint[] = [],
    pageSize = 20,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{
    data: T[];
    hasMore: boolean;
    lastDoc?: QueryDocumentSnapshot<DocumentData>;
  }> {
    try {
      let queryConstraints = [...constraints, limit(pageSize + 1)];
      
      if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }

      const q = query(collection(this.db, collectionName), ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const docs = querySnapshot.docs;
      const hasMore = docs.length > pageSize;
      const data = docs.slice(0, pageSize);
      
      const result = {
        data: data.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            createdAt: this.timestampToDate(docData.createdAt),
            updatedAt: this.timestampToDate(docData.updatedAt),
          };
        }) as T[],
        hasMore,
        ...(hasMore && { lastDoc: docs[pageSize - 1] }),
      };
      
      return result;
    } catch (error) {
      this.handleError(error, `paginated query ${collectionName}`);
    }
  }
}

// Helper function for startAfter import
import { startAfter } from 'firebase/firestore';