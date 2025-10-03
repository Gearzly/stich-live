export declare const auth: import("firebase-admin/auth").Auth;
export declare const db: FirebaseFirestore.Firestore;
export declare const storage: import("firebase-admin/storage").Storage;
export declare const COLLECTIONS: {
    readonly USERS: "users";
    readonly APPS: "apps";
    readonly GENERATION_SESSIONS: "generation_sessions";
    readonly GENERATION_LOGS: "generation_logs";
    readonly TEMPLATES: "templates";
    readonly USAGE: "usage";
    readonly ADMIN: "admin";
};
export declare const getCollection: (collectionName: string) => FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>;
export declare const getDocument: (collectionName: string, documentId: string) => FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>;
//# sourceMappingURL=firebase.d.ts.map