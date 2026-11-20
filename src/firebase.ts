import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
  onAuthStateChanged,
  getAdditionalUserInfo,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errStr = error instanceof Error ? error.message : String(error);
  const isOfflineOrUnavailable =
    errStr.includes('unavailable') ||
    errStr.includes('client is offline') ||
    (error as any)?.code === 'unavailable';

  const errInfo: FirestoreErrorInfo = {
    error: errStr,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  if (isOfflineOrUnavailable) {
    console.warn('Firestore offline / connection pending. Operating with local cache:', errInfo);
    return;
  }

  console.error('Firestore Error:', JSON.stringify(errInfo));
  // Report instead of throwing: callers fire writes without awaiting them, and a throw
  // here would surface as an unhandled rejection. InventoryContext shows a toast.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('terit:cloud-error', { detail: errInfo }));
  }
}

// Test connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    } else {
      console.warn('Firestore initial connection status (operating with local cache):', error);
    }
  }
}

// Not called at startup: it cost a network round-trip on every load just to log a message.

export { signInWithPopup, signOut, onAuthStateChanged, getAdditionalUserInfo };
export type { User };
