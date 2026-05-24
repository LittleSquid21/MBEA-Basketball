/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, connectFirestoreEmulator } from 'firebase/firestore';

// This file is created by the set_up_firebase tool
import firebaseConfig from '../firebase-applet-config.json';

console.log('Initializing Firebase with Project ID:', firebaseConfig.projectId);
console.log('Using Firestore Database ID:', firebaseConfig.firestoreDatabaseId);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch(err => console.error('Auth persistence error:', err));

// Use initializeFirestore to enable experimentalForceLongPolling
// This helps in environments where WebSockets might be restricted or unstable
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection
async function testConnection() {
  console.log('Testing Firestore connection...');
  try {
    // We use a path that is allowed by our security rules (teams is publicly readable)
    // Even if the document doesn't exist, a successful request confirms connectivity.
    await getDocFromServer(doc(db, 'teams', 'connection_test'));
    console.log('Firestore connection successful.');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        // This is actually a success in terms of connectivity!
        console.log('Firestore reached, but permission was denied for this specific test path.');
      } else if (error.message.includes('the client is offline')) {
        console.error("CRITICAL: Firestore client is offline.");
      } else {
        console.error('Firestore connection test failed:', error);
      }
    }
  }
}

testConnection();
