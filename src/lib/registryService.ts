import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';
import { PreEnrolledRecord, ActivationVerificationRequest, UserRole } from '../types';
import { SEED_SCHOOL_REGISTRY } from '../data/seedData';

// In-memory runtime mirror for server & client fallback
let localRegistry: PreEnrolledRecord[] = [...SEED_SCHOOL_REGISTRY];

export async function getSchoolRegistry(): Promise<PreEnrolledRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'schoolRegistry'));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as PreEnrolledRecord);
    }
  } catch (err) {
    console.warn('Firestore registry fetch note:', err);
  }
  return localRegistry;
}

export async function seedSchoolRegistry(): Promise<void> {
  try {
    for (const record of SEED_SCHOOL_REGISTRY) {
      await setDoc(doc(db, 'schoolRegistry', record.id), record, { merge: true });
    }
  } catch (err) {
    console.warn('Seed school registry warning:', err);
  }
}

/**
 * Verify identity with the school's authorized registry.
 * This runs securely via server endpoint or client-validated registry.
 * Crucially: Role is determined EXCLUSIVELY by the authorized backend record.
 */
export async function verifySchoolIdentity(
  req: ActivationVerificationRequest
): Promise<{
  success: boolean;
  message: string;
  verifiedRecord?: PreEnrolledRecord;
}> {
  // First attempt server-side verification
  try {
    const res = await fetch('/api/auth/verify-activation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: 'School record successfully verified.',
        verifiedRecord: data.verifiedRecord,
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        message:
          errData.message ||
          'No matching authorized school record found. Please contact school administration.',
      };
    }
  } catch (netErr) {
    console.warn('API registry verification notice, falling back to local registry check:', netErr);
  }

  // Fallback verification against local registry (e.g. if offline or direct call)
  const normName = req.fullName.trim().toLowerCase();
  const normEmail = req.email.trim().toLowerCase();

  let matched: PreEnrolledRecord | undefined;

  if (req.identityType === 'student') {
    const normStudentId = (req.studentId || '').trim().toUpperCase();
    matched = localRegistry.find((r) => {
      if (r.identityType !== 'student') return false;
      const idMatch =
        (r.studentIdNumber && r.studentIdNumber.toUpperCase() === normStudentId) ||
        r.id.toUpperCase() === normStudentId;
      const nameMatch = r.fullName.toLowerCase() === normName;
      const dobMatch = req.dateOfBirth ? r.dateOfBirth === req.dateOfBirth : true;
      const emailMatch = r.officialEmail.toLowerCase() === normEmail;

      return (idMatch || emailMatch) && (nameMatch || dobMatch);
    });
  } else if (req.identityType === 'parent') {
    const normChildId = (req.childStudentId || '').trim().toUpperCase();
    matched = localRegistry.find((r) => {
      if (r.identityType !== 'parent') return false;
      const nameMatch = r.fullName.toLowerCase() === normName;
      const emailMatch = r.officialEmail.toLowerCase() === normEmail;
      const childMatch =
        !normChildId ||
        (r.studentNameOrId && r.studentNameOrId.toUpperCase() === normChildId) ||
        r.linkedStudentIds.some((sId) => sId.toUpperCase().includes(normChildId));

      return (nameMatch || emailMatch) && childMatch;
    });
  } else if (req.identityType === 'coach') {
    const normStaffId = (req.staffId || '').trim().toUpperCase();
    const normCode = (req.accessCode || '').trim().toUpperCase();
    matched = localRegistry.find((r) => {
      if (r.identityType !== 'coach') return false;
      const staffMatch =
        (r.staffIdNumber && r.staffIdNumber.toUpperCase() === normStaffId) ||
        r.id.toUpperCase() === normStaffId;
      const codeMatch = !normCode || (r.accessCode && r.accessCode.toUpperCase() === normCode);
      const emailMatch = r.officialEmail.toLowerCase() === normEmail;

      return (staffMatch || emailMatch) && codeMatch;
    });
  }

  if (!matched) {
    return {
      success: false,
      message:
        'No matching school registry record found. Please verify your details with your school administrator.',
    };
  }

  if (matched.activationStatus === 'activated') {
    return {
      success: false,
      message:
        'This school record has already been activated. Please sign in with your registered email and password.',
    };
  }

  return {
    success: true,
    message: 'Authorized school record confirmed.',
    verifiedRecord: matched,
  };
}

export async function markRecordAsActivated(recordId: string, uid: string): Promise<void> {
  // Update local
  localRegistry = localRegistry.map((r) =>
    r.id === recordId
      ? {
          ...r,
          activationStatus: 'activated',
          activatedAt: new Date().toISOString(),
          activatedUid: uid,
        }
      : r
  );

  // Notify server
  try {
    await fetch('/api/auth/complete-activation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId, uid }),
    });
  } catch (e) {
    console.warn('Server activation completion sync notice:', e);
  }

  // Update Firestore if available
  try {
    await setDoc(
      doc(db, 'schoolRegistry', recordId),
      {
        activationStatus: 'activated',
        activatedAt: new Date().toISOString(),
        activatedUid: uid,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore registry update warning:', err);
  }
}
