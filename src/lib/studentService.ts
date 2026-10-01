import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Student,
  Subject,
  Topic,
  Assignment,
  Assessment,
  TrainingSession,
  WeeklyPlan,
  CourseMaterial,
  UserProfile,
  WeeklyPlanItem,
  NewAssessmentInput,
  NewAssignmentInput,
  NewTrainingInput,
  UpdateMasteryInput,
} from '../types';
import {
  SEED_STUDENTS,
  SEED_SUBJECTS,
  SEED_TOPICS,
  SEED_ASSIGNMENTS,
  SEED_ASSESSMENTS,
  SEED_TRAINING,
  SEED_WEEKLY_PLAN,
  SEED_COURSE_MATERIALS,
  SEED_USERS,
} from '../data/seedData';

// In-memory fallback cache so the application remains 100% functional even during network blips or cold boot
let localStudentsCache: Student[] = [...SEED_STUDENTS];
let localWeeklyPlanCache: Record<string, WeeklyPlan> = {
  student_maya_patel: { ...SEED_WEEKLY_PLAN },
};

/**
 * Deterministic status calculator for coach and student dashboards
 */
export function calculateStudentAttention(
  student: Student,
  topics: Topic[] = [],
  assignments: Assignment[] = [],
  assessments: Assessment[] = [],
  training: TrainingSession[] = []
): {
  attentionStatus: 'On Track' | 'Watch' | 'Attention';
  reason: string;
  academicStatus: 'Good Standing' | 'Needs Attention' | 'Watchlist' | 'High Risk';
  trainingLoad: 'Light' | 'Moderate' | 'High' | 'Extreme';
  workloadStatus: 'Balanced' | 'Manageable' | 'High' | 'Critical';
} {
  // Check overdue assignments
  const overdueCount = assignments.filter((a) => a.status === 'overdue').length;
  // Check weak topics (<70%)
  const weakTopics = topics.filter((t) => t.masteryPercentage < 70);
  // Check if upcoming assessment matches a weak topic
  const criticalAssessments = assessments.filter((asm) =>
    weakTopics.some(
      (wt) =>
        wt.subjectName.toLowerCase().includes(asm.subjectName.toLowerCase()) ||
        wt.name.toLowerCase().includes(asm.topicName.toLowerCase())
    )
  );
  // High intensity training count
  const highIntensityDays = training.filter((t) => t.intensity === 'High').length;
  const totalTrainingMinutes = training.reduce((acc, t) => acc + t.durationMinutes, 0);

  let trainingLoad: 'Light' | 'Moderate' | 'High' | 'Extreme' = 'Moderate';
  if (totalTrainingMinutes > 500 || highIntensityDays >= 4) {
    trainingLoad = 'Extreme';
  } else if (totalTrainingMinutes >= 240 || highIntensityDays >= 2) {
    trainingLoad = 'High';
  } else if (totalTrainingMinutes < 120) {
    trainingLoad = 'Light';
  }

  let academicStatus: 'Good Standing' | 'Needs Attention' | 'Watchlist' | 'High Risk' = 'Good Standing';
  if (overdueCount >= 2 || (weakTopics.length >= 2 && student.overallGpa < 3.0)) {
    academicStatus = 'High Risk';
  } else if (weakTopics.length > 0 || overdueCount === 1) {
    academicStatus = 'Needs Attention';
  } else if (student.overallGpa < 3.5) {
    academicStatus = 'Watchlist';
  }

  // Workload determination
  let workloadStatus: 'Balanced' | 'Manageable' | 'High' | 'Critical' = 'Manageable';
  if ((trainingLoad === 'High' || trainingLoad === 'Extreme') && (assessments.length >= 2 || weakTopics.length >= 1)) {
    workloadStatus = 'High';
  }
  if (trainingLoad === 'Extreme' || (assessments.length >= 3 && overdueCount >= 1)) {
    workloadStatus = 'Critical';
  }
  if (trainingLoad === 'Moderate' && academicStatus === 'Good Standing') {
    workloadStatus = 'Balanced';
  }

  // Attention status and reason
  if (overdueCount > 0) {
    return {
      attentionStatus: 'Attention',
      reason: `${overdueCount} overdue assignment${overdueCount > 1 ? 's' : ''} blocking academic eligibility.`,
      academicStatus,
      trainingLoad,
      workloadStatus,
    };
  }

  if (criticalAssessments.length > 0) {
    const asm = criticalAssessments[0];
    const weakMatch = weakTopics.find((wt) =>
      wt.subjectName.toLowerCase().includes(asm.subjectName.toLowerCase())
    ) || weakTopics[0];
    return {
      attentionStatus: 'Attention',
      reason: `${weakMatch?.name || 'Topic'} mastery is ${weakMatch?.masteryPercentage ?? 64}% with an assessment on ${asm.date}, overlapping ${trainingLoad.toLowerCase()} training load.`,
      academicStatus,
      trainingLoad,
      workloadStatus,
    };
  }

  if (weakTopics.length >= 2) {
    return {
      attentionStatus: 'Attention',
      reason: `Multiple topics below 70% threshold (${weakTopics.map((w) => w.name).join(', ')}).`,
      academicStatus,
      trainingLoad,
      workloadStatus,
    };
  }

  if (trainingLoad === 'Extreme') {
    return {
      attentionStatus: 'Watch',
      reason: 'Extreme weekly training volume with insufficient physical recovery buffer.',
      academicStatus,
      trainingLoad,
      workloadStatus,
    };
  }

  if (weakTopics.length === 1) {
    return {
      attentionStatus: 'Watch',
      reason: `${weakTopics[0].name} mastery is at ${weakTopics[0].masteryPercentage}%; needs targeted study window.`,
      academicStatus,
      trainingLoad,
      workloadStatus,
    };
  }

  return {
    attentionStatus: 'On Track',
    reason: student.attentionReason || 'Academics and athletic training are well balanced.',
    academicStatus,
    trainingLoad,
    workloadStatus,
  };
}

/**
 * Seeds initial demo data into Cloud Firestore
 */
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    // Seed users
    for (const user of SEED_USERS) {
      await setDoc(doc(db, 'users', user.id), user);
    }
    // Seed students
    for (const student of SEED_STUDENTS) {
      await setDoc(doc(db, 'students', student.id), student);
    }
    // Seed Maya's subcollections (primary demo student)
    for (const subject of SEED_SUBJECTS) {
      await setDoc(doc(db, 'students', 'student_maya_patel', 'subjects', subject.id), subject);
    }
    for (const topic of SEED_TOPICS) {
      await setDoc(doc(db, 'students', 'student_maya_patel', 'topics', topic.id), topic);
    }
    for (const asg of SEED_ASSIGNMENTS) {
      await setDoc(doc(db, 'students', 'student_maya_patel', 'assignments', asg.id), asg);
    }
    for (const asm of SEED_ASSESSMENTS) {
      await setDoc(doc(db, 'students', 'student_maya_patel', 'assessments', asm.id), asm);
    }
    for (const trn of SEED_TRAINING) {
      await setDoc(doc(db, 'students', 'student_maya_patel', 'trainingSessions', trn.id), trn);
    }
    await setDoc(
      doc(db, 'students', 'student_maya_patel', 'weeklyPlans', SEED_WEEKLY_PLAN.id),
      SEED_WEEKLY_PLAN
    );

    // Seed course materials
    for (const mat of SEED_COURSE_MATERIALS) {
      await setDoc(doc(db, 'courseMaterials', mat.id), mat);
    }
  } catch (error) {
    console.warn('Firestore seeding fallback to local cache:', error);
  }
}

/**
 * Fetch all students
 */
export async function getStudentsList(): Promise<Student[]> {
  try {
    const snap = await getDocs(collection(db, 'students'));
    if (!snap.empty) {
      const items: Student[] = [];
      snap.forEach((d) => items.push(d.data() as Student));
      localStudentsCache = items;
      return items;
    }
    // If database was empty, seed it and return seed list
    seedInitialFirestoreData().catch(console.error);
    return SEED_STUDENTS;
  } catch (err) {
    console.warn('Using seeded students due to fetch error:', err);
    return localStudentsCache;
  }
}

/**
 * Fetch single student by ID
 */
export async function getStudentById(studentId: string): Promise<Student | null> {
  try {
    const snap = await getDoc(doc(db, 'students', studentId));
    if (snap.exists()) {
      return snap.data() as Student;
    }
  } catch (error) {
    console.warn('getStudentById fallback:', error);
  }
  const match = SEED_STUDENTS.find((s) => s.id === studentId);
  return match || null;
}

/**
 * Fetch student topics
 */
export async function getStudentTopics(studentId: string): Promise<Topic[]> {
  try {
    const snap = await getDocs(collection(db, 'students', studentId, 'topics'));
    if (!snap.empty) {
      const list: Topic[] = [];
      snap.forEach((d) => list.push(d.data() as Topic));
      return list;
    }
  } catch (error) {
    console.warn('getStudentTopics fallback:', error);
  }
  if (studentId === 'student_maya_patel') {
    return SEED_TOPICS;
  }
  // Generic topics for other demo students
  return [
    {
      id: `${studentId}_top_1`,
      studentId,
      subjectId: 'sub_math',
      subjectName: 'Mathematics',
      name: 'Algebra II',
      masteryPercentage: 78,
      status: 'proficient',
    },
    {
      id: `${studentId}_top_2`,
      studentId,
      subjectId: 'sub_sci',
      subjectName: 'Science',
      name: 'Physics Principles',
      masteryPercentage: 82,
      status: 'strong',
    },
  ];
}

/**
 * Fetch student assignments
 */
export async function getStudentAssignments(studentId: string): Promise<Assignment[]> {
  try {
    const snap = await getDocs(collection(db, 'students', studentId, 'assignments'));
    if (!snap.empty) {
      const list: Assignment[] = [];
      snap.forEach((d) => list.push(d.data() as Assignment));
      return list;
    }
  } catch (error) {
    console.warn('getStudentAssignments fallback:', error);
  }
  if (studentId === 'student_maya_patel') {
    return SEED_ASSIGNMENTS;
  }
  if (studentId === 'student_jordan_taylor') {
    return [
      {
        id: 'asg_jordan_hist_overdue',
        studentId: 'student_jordan_taylor',
        subjectId: 'sub_hist',
        subjectName: 'History',
        title: 'Cold War Primary Essay',
        dueDate: '3 days ago',
        status: 'overdue',
        estimatedMinutes: 60,
      },
      {
        id: 'asg_jordan_bio_overdue',
        studentId: 'student_jordan_taylor',
        subjectId: 'sub_bio',
        subjectName: 'Biology',
        title: 'Cellular Respiration Lab Report',
        dueDate: 'Yesterday',
        status: 'overdue',
        estimatedMinutes: 45,
      },
    ];
  }
  return [];
}

/**
 * Fetch student assessments
 */
export async function getStudentAssessments(studentId: string): Promise<Assessment[]> {
  try {
    const snap = await getDocs(collection(db, 'students', studentId, 'assessments'));
    if (!snap.empty) {
      const list: Assessment[] = [];
      snap.forEach((d) => list.push(d.data() as Assessment));
      return list;
    }
  } catch (error) {
    console.warn('getStudentAssessments fallback:', error);
  }
  if (studentId === 'student_maya_patel') {
    return SEED_ASSESSMENTS;
  }
  return [];
}

/**
 * Fetch training sessions
 */
export async function getStudentTraining(studentId: string): Promise<TrainingSession[]> {
  try {
    const snap = await getDocs(collection(db, 'students', studentId, 'trainingSessions'));
    if (!snap.empty) {
      const list: TrainingSession[] = [];
      snap.forEach((d) => list.push(d.data() as TrainingSession));
      return list;
    }
  } catch (error) {
    console.warn('getStudentTraining fallback:', error);
  }
  if (studentId === 'student_maya_patel') {
    return SEED_TRAINING;
  }
  return [
    {
      id: `${studentId}_trn_mon`,
      studentId,
      date: '2026-10-05',
      dayOfWeek: 'Monday',
      sport: 'Team Practice',
      durationMinutes: 60,
      intensity: 'Moderate',
    },
    {
      id: `${studentId}_trn_wed`,
      studentId,
      date: '2026-10-07',
      dayOfWeek: 'Wednesday',
      sport: 'Conditioning',
      durationMinutes: 75,
      intensity: 'High',
    },
  ];
}

/**
 * Fetch weekly plan
 */
export async function getStudentWeeklyPlan(studentId: string): Promise<WeeklyPlan> {
  try {
    const snap = await getDoc(doc(db, 'students', studentId, 'weeklyPlans', 'plan_maya_week_current'));
    if (snap.exists()) {
      return snap.data() as WeeklyPlan;
    }
  } catch (error) {
    console.warn('getStudentWeeklyPlan fallback:', error);
  }
  if (localWeeklyPlanCache[studentId]) {
    return localWeeklyPlanCache[studentId];
  }
  return { ...SEED_WEEKLY_PLAN, studentId };
}

/**
 * Update weekly plan in Firestore and local state
 */
export async function updateStudentWeeklyPlan(
  studentId: string,
  updatedItems: WeeklyPlanItem[],
  rationale?: string
): Promise<WeeklyPlan> {
  const planId = 'plan_maya_week_current';
  const updatedPlan: WeeklyPlan = {
    id: planId,
    studentId,
    weekStartDate: '2026-10-05',
    status: 'active',
    items: updatedItems,
    rationale: rationale || 'Plan updated via Student Balance Agent with student confirmation.',
    generatedBy: 'balance_agent',
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'students', studentId, 'weeklyPlans', planId), updatedPlan);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}/weeklyPlans/${planId}`);
  }

  localWeeklyPlanCache[studentId] = updatedPlan;
  return updatedPlan;
}

/**
 * Fetch course materials
 */
export async function getCourseMaterials(): Promise<CourseMaterial[]> {
  try {
    const snap = await getDocs(collection(db, 'courseMaterials'));
    if (!snap.empty) {
      const items: CourseMaterial[] = [];
      snap.forEach((d) => items.push(d.data() as CourseMaterial));
      return items;
    }
  } catch (error) {
    console.warn('getCourseMaterials fallback:', error);
  }
  return SEED_COURSE_MATERIALS;
}

/**
 * Re-calculate student attention status based on latest records and update Firestore
 */
export async function syncStudentAttentionStatus(studentId: string): Promise<Student | null> {
  try {
    const student = await getStudentById(studentId);
    if (!student) return null;

    const [topics, assignments, assessments, training] = await Promise.all([
      getStudentTopics(studentId),
      getStudentAssignments(studentId),
      getStudentAssessments(studentId),
      getStudentTraining(studentId),
    ]);

    const calculated = calculateStudentAttention(student, topics, assignments, assessments, training);

    const updatedStudent: Student = {
      ...student,
      attentionStatus: calculated.attentionStatus,
      attentionReason: calculated.reason,
      academicStatus: calculated.academicStatus,
      trainingLoad: calculated.trainingLoad,
      workloadStatus: calculated.workloadStatus,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'students', studentId), updatedStudent, { merge: true });

    // Update in-memory cache
    localStudentsCache = localStudentsCache.map((s) => (s.id === studentId ? updatedStudent : s));

    return updatedStudent;
  } catch (err) {
    console.error('syncStudentAttentionStatus error:', err);
    return null;
  }
}

/**
 * Add a new assessment for a student
 */
export async function addStudentAssessment(
  studentId: string,
  input: NewAssessmentInput
): Promise<Assessment> {
  const assessmentId = `asm_${Date.now()}`;
  const newAssessment: Assessment = {
    id: assessmentId,
    studentId,
    subjectId: `sub_${input.subjectName.toLowerCase().slice(0, 4)}`,
    subjectName: input.subjectName,
    topicName: input.topicName,
    title: input.title,
    date: input.date,
    score: input.score,
    weight: input.weight,
    importance: input.importance,
    status: input.score != null ? 'graded' : 'upcoming',
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'students', studentId, 'assessments', assessmentId), newAssessment);
    await syncStudentAttentionStatus(studentId);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `students/${studentId}/assessments/${assessmentId}`);
  }

  return newAssessment;
}

/**
 * Delete an assessment
 */
export async function deleteStudentAssessment(
  studentId: string,
  assessmentId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'students', studentId, 'assessments', assessmentId));
    await syncStudentAttentionStatus(studentId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `students/${studentId}/assessments/${assessmentId}`);
  }
}

/**
 * Add a new assignment for a student
 */
export async function addStudentAssignment(
  studentId: string,
  input: NewAssignmentInput
): Promise<Assignment> {
  const assignmentId = `asg_${Date.now()}`;
  const newAssignment: Assignment = {
    id: assignmentId,
    studentId,
    subjectId: `sub_${input.subjectName.toLowerCase().slice(0, 4)}`,
    subjectName: input.subjectName,
    title: input.title,
    dueDate: input.dueDate,
    status: 'pending',
    estimatedMinutes: input.estimatedMinutes,
    notes: input.notes,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'students', studentId, 'assignments', assignmentId), newAssignment);
    await syncStudentAttentionStatus(studentId);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `students/${studentId}/assignments/${assignmentId}`);
  }

  return newAssignment;
}

/**
 * Delete an assignment
 */
export async function deleteStudentAssignment(
  studentId: string,
  assignmentId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'students', studentId, 'assignments', assignmentId));
    await syncStudentAttentionStatus(studentId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `students/${studentId}/assignments/${assignmentId}`);
  }
}

/**
 * Update topic mastery percentage
 */
export async function updateStudentTopicMastery(
  studentId: string,
  input: UpdateMasteryInput
): Promise<Topic> {
  const status: 'strong' | 'proficient' | 'needs_attention' =
    input.masteryPercentage >= 80 ? 'strong' : input.masteryPercentage >= 70 ? 'proficient' : 'needs_attention';

  const updatedTopic: Topic = {
    id: input.topicId,
    studentId,
    subjectId: `sub_${input.subjectName.toLowerCase().slice(0, 4)}`,
    subjectName: input.subjectName,
    name: input.topicName,
    masteryPercentage: input.masteryPercentage,
    lastAssessedDate: 'Today',
    status,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'students', studentId, 'topics', input.topicId), updatedTopic, { merge: true });
    await syncStudentAttentionStatus(studentId);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}/topics/${input.topicId}`);
  }

  return updatedTopic;
}

/**
 * Add a training session
 */
export async function addStudentTrainingSession(
  studentId: string,
  input: NewTrainingInput
): Promise<TrainingSession> {
  const sessionId = `trn_${Date.now()}`;
  const newSession: TrainingSession = {
    id: sessionId,
    studentId,
    date: input.date || '2026-10-08',
    dayOfWeek: input.dayOfWeek,
    sport: input.sport,
    durationMinutes: input.durationMinutes,
    intensity: input.intensity,
    notes: input.notes,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'students', studentId, 'trainingSessions', sessionId), newSession);
    await syncStudentAttentionStatus(studentId);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `students/${studentId}/trainingSessions/${sessionId}`);
  }

  return newSession;
}

/**
 * Delete a training session
 */
export async function deleteStudentTrainingSession(
  studentId: string,
  sessionId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'students', studentId, 'trainingSessions', sessionId));
    await syncStudentAttentionStatus(studentId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `students/${studentId}/trainingSessions/${sessionId}`);
  }
}

