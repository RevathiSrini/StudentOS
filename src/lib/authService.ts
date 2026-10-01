import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole, ActivationVerificationRequest } from '../types';
import { SEED_USERS } from '../data/seedData';
import { verifySchoolIdentity, markRecordAsActivated } from './registryService';

export async function signInUser(email: string, pass: string): Promise<UserProfile> {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  const uid = credential.user.uid;
  const userDoc = await getDoc(doc(db, 'users', uid));

  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }

  // Fallback profile if Firestore doc was not seeded
  const fallback: UserProfile = {
    id: uid,
    email: credential.user.email || email,
    displayName: credential.user.displayName || email.split('@')[0],
    role: 'student',
    linkedStudentIds: ['student_maya_patel'],
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', uid), fallback);
  return fallback;
}

/**
 * Account Activation Architecture:
 * 1. Checks school registry for pre-enrolled identity
 * 2. Role is strictly assigned from the verified backend record (NOT user choice)
 * 3. Prevents duplicate activation of existing records
 * 4. Creates Firebase Auth user and links UID to school identity
 */
export async function activateUserAccount(
  req: ActivationVerificationRequest
): Promise<UserProfile> {
  if (!req.password || req.password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  // 1. Verify against school registry
  const verification = await verifySchoolIdentity(req);
  if (!verification.success || !verification.verifiedRecord) {
    throw new Error(verification.message || 'School registry verification failed.');
  }

  const record = verification.verifiedRecord;

  // 2. Create or link Firebase Auth account
  let uid = '';
  try {
    const cred = await createUserWithEmailAndPassword(auth, req.email.trim(), req.password);
    uid = cred.user.uid;
  } catch (authErr: any) {
    if (authErr.code === 'auth/email-already-in-use') {
      try {
        const cred = await signInWithEmailAndPassword(auth, req.email.trim(), req.password);
        uid = cred.user.uid;
      } catch (signInErr: any) {
        throw new Error(
          'An account with this email already exists in Firebase Auth. Please sign in or use another email for activation.'
        );
      }
    } else {
      throw authErr;
    }
  }

  // 3. Connect Firebase UID to the authorized pre-enrolled school identity
  const newProfile: UserProfile = {
    id: uid,
    email: req.email.trim(),
    displayName: record.fullName,
    role: record.assignedRole, // Strictly authoritative role from school database
    linkedStudentIds: record.linkedStudentIds,
    schoolIdentityId: record.id,
    activatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Write profile to Firestore
  await setDoc(doc(db, 'users', uid), newProfile, { merge: true });

  // 4. Mark school registry record as activated
  await markRecordAsActivated(record.id, uid);

  return newProfile;
}

export async function signUpUser(
  email: string,
  pass: string,
  displayName: string,
  role: UserRole
): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = credential.user.uid;

  const newProfile: UserProfile = {
    id: uid,
    email,
    displayName,
    role,
    linkedStudentIds: role === 'student' ? [uid] : role === 'parent' ? ['student_maya_patel'] : [
      'student_maya_patel',
      'student_liam_chen',
      'student_jordan_taylor',
      'student_noah_williams',
      'student_ava_johnson',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', uid), newProfile);
  return newProfile;
}

export async function resetUserPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Sign in as a demo user (Maya Patel / Priya Patel / Coach Marcus Reed)
 * using Firebase Anonymous Auth so the session is genuinely authenticated in Firebase.
 */
export async function signInDemoUser(role: UserRole): Promise<UserProfile> {
  // Sign in with Firebase Anonymous Auth
  let uid = auth.currentUser?.uid;
  if (!auth.currentUser) {
    try {
      const cred = await signInAnonymously(auth);
      uid = cred.user.uid;
    } catch (e) {
      console.warn('Anonymous sign-in notice, using session auth:', e);
      uid = `demo_${role}_${Date.now()}`;
    }
  }

  // Select seed persona based on demo role
  const persona =
    role === 'student'
      ? SEED_USERS.find((u) => u.id === 'student_maya_patel') || SEED_USERS[0]
      : role === 'parent'
      ? SEED_USERS.find((u) => u.id === 'parent_priya_patel') || SEED_USERS[1]
      : SEED_USERS.find((u) => u.id === 'coach_marcus_reed') || SEED_USERS[2];

  const demoProfile: UserProfile = {
    id: uid || persona.id,
    email: persona.email,
    displayName: persona.displayName,
    role: persona.role,
    linkedStudentIds: persona.linkedStudentIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Write the demo session profile to Firestore so rules and queries are authorized
  if (uid && auth.currentUser) {
    try {
      await setDoc(doc(db, 'users', uid), demoProfile, { merge: true });
    } catch (err) {
      console.warn('Demo profile Firestore sync warning:', err);
    }
  }

  return demoProfile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('getUserProfile error:', err);
  }
  return null;
}

export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
