export type UserRole = 'student' | 'parent' | 'coach';

export type SchoolIdentityType = 'student' | 'parent' | 'coach';

export interface PreEnrolledRecord {
  id: string; // e.g. 'STU-2026-001' or 'STAFF-ATH-01'
  identityType: SchoolIdentityType; // Verification category selected
  assignedRole: UserRole; // Actual role verified from school database
  fullName: string;
  officialEmail: string;
  dateOfBirth?: string; // YYYY-MM-DD (for students)
  grade?: string; // e.g. 'Grade 11'
  sport?: string;
  studentIdNumber?: string; // e.g. 'STU-2026-001'
  staffIdNumber?: string; // e.g. 'STAFF-ATH-01'
  accessCode?: string; // e.g. 'ATH-COACH-88'
  linkedStudentIds: string[]; // Associated students
  studentNameOrId?: string; // Child student ID or name for parent verification
  activationStatus: 'pending' | 'activated';
  activatedAt?: string;
  activatedUid?: string;
}

export interface ActivationVerificationRequest {
  identityType: SchoolIdentityType;
  fullName: string;
  email: string;
  studentId?: string;
  dateOfBirth?: string;
  childStudentId?: string;
  staffId?: string;
  accessCode?: string;
  password?: string;
}

export interface ActivationResult {
  success: boolean;
  message: string;
  record?: PreEnrolledRecord;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  linkedStudentIds?: string[];
  schoolIdentityId?: string;
  activatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type IntensityLevel = 'Light' | 'Moderate' | 'High';
export type AttentionStatus = 'On Track' | 'Watch' | 'Attention';
export type AcademicStatus = 'Good Standing' | 'Needs Attention' | 'Watchlist' | 'High Risk';
export type WorkloadStatus = 'Balanced' | 'Manageable' | 'High' | 'Critical';

export interface Student {
  id: string;
  name: string;
  grade: string;
  sport: string;
  avatar?: string;
  primaryCoachId: string;
  parentIds: string[];
  overallGpa: number;
  statusSummary: string;
  academicStatus: AcademicStatus;
  trainingLoad: IntensityLevel | 'Extreme';
  workloadStatus: WorkloadStatus;
  attentionStatus: AttentionStatus;
  attentionReason: string;
  updatedAt?: string;
}

export interface Subject {
  id: string;
  studentId: string;
  name: string;
  teacher: string;
  currentGrade: number; // e.g. 88
  overallMastery: number; // e.g. 85
  updatedAt?: string;
}

export interface Topic {
  id: string;
  studentId: string;
  subjectId: string;
  subjectName: string;
  name: string;
  masteryPercentage: number; // e.g. 64
  lastAssessedDate?: string;
  status: 'strong' | 'proficient' | 'needs_attention';
  updatedAt?: string;
}

export interface Assignment {
  id: string;
  studentId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  dueDate: string; // e.g. "Friday" or "2026-10-06"
  status: 'pending' | 'completed' | 'overdue';
  estimatedMinutes: number;
  notes?: string;
  updatedAt?: string;
}

export interface Assessment {
  id: string;
  studentId: string;
  subjectId: string;
  subjectName: string;
  topicName: string;
  title: string;
  date: string; // e.g. "Thursday"
  score?: number; // e.g. 64 or 85
  weight: string; // e.g. "20% of Term"
  importance: 'low' | 'medium' | 'high' | 'critical';
  status?: 'upcoming' | 'completed' | 'graded';
  updatedAt?: string;
}

export interface NewAssessmentInput {
  subjectName: string;
  title: string;
  topicName: string;
  date: string;
  score?: number;
  weight: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface NewAssignmentInput {
  subjectName: string;
  title: string;
  dueDate: string;
  estimatedMinutes: number;
  notes?: string;
}

export interface NewTrainingInput {
  sport: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  date?: string;
  durationMinutes: number;
  intensity: IntensityLevel;
  notes?: string;
}

export interface UpdateMasteryInput {
  topicId: string;
  subjectName: string;
  topicName: string;
  masteryPercentage: number;
}

export interface TrainingSession {
  id: string;
  studentId: string;
  date: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  sport: string;
  durationMinutes: number;
  intensity: IntensityLevel;
  notes?: string;
  updatedAt?: string;
}

export interface WeeklyPlanItem {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  type: 'academic_study' | 'training' | 'assessment' | 'assignment' | 'recovery';
  title: string;
  subjectOrSport: string;
  durationMinutes: number;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
  focusTopic?: string;
  intensity?: IntensityLevel;
  reason: string;
  completed?: boolean;
}

export interface WeeklyPlan {
  id: string;
  studentId: string;
  weekStartDate: string;
  status: 'draft' | 'active' | 'completed';
  items: WeeklyPlanItem[];
  rationale: string;
  generatedBy: 'student' | 'balance_agent' | 'coach';
  updatedAt?: string;
}

export interface CourseMaterial {
  id: string;
  subject: string;
  topic: string;
  title: string;
  content: string;
  keyConcepts: string[];
  referenceSources: string[];
  updatedAt?: string;
}

export interface TutorMessage {
  id: string;
  sender: 'student' | 'tutor';
  text: string;
  sources?: string[];
  timestamp: string;
}

export interface ParentCopilotResponse {
  facts: string[];
  observations: string[];
  suggestions: string[];
  rawText?: string;
}

export interface ProposedPlanModification {
  fromDay: string;
  toDay: string;
  itemTitle: string;
  durationMinutes: number;
  riskWarning?: string;
  rationale: string;
}

export interface BalanceAgentResponse {
  message: string;
  proposedPlan?: WeeklyPlanItem[];
  reasoning: string;
  conflictWarning?: string;
  requiresConfirmation: boolean;
  proposedChange?: ProposedPlanModification;
}

export interface EvalCase {
  id: string;
  category:
    | 'Correct Student Context'
    | 'Correct Factual Answers'
    | 'Hallucination Resistance'
    | 'Authorization / Privacy'
    | 'Structured Output Validity'
    | 'Correct Agent Action'
    | 'Correct Weekly-Plan Reasoning';
  description: string;
  userRole: UserRole;
  requestStudentId: string;
  parentOrCoachId?: string;
  inputPrompt: string;
  expectedAssertion: string;
  deterministicValidator: (output: any, rawResponse?: string) => { passed: boolean; reason: string };
}
