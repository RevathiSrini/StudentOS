# StudentOS — AI-Powered Student Success Platform

> **Notice**: All student records included in the public demo are synthetic.

StudentOS is a full-stack student success platform engineered for schools where students balance rigorous academics and competitive athletic training. It integrates academic topic mastery, assignment tracking, exam schedules, varsity athletic conditioning, parents, coaches, and AI-powered balance guidance into a unified, reliable system.

---

## 1. Problem StudentOS Solves

Student-athletes face a persistent coordination problem:
- Academic instructors set homework and exams without awareness of high-intensity conditioning sessions or away-game travel.
- Athletic coaches often lack visibility into upcoming academic crunches until a student's grades drop or eligibility is jeopardized.
- Students carry the cognitive burden of balancing physical fatigue with exam preparation, frequently studying late after grueling 90-minute workouts.
- Parents struggle to separate verifiable school facts from subjective stress signals.

StudentOS bridges these silos using structured application data, role-based boundaries, and an actionable AI reasoning agent that resolves workload collisions.

---

## 2. Architecture & Data Flow

### Account Activation Architecture (School Registry Pre-enrollment)
Unlike generic public signup models, StudentOS enforces a real school enrollment security architecture:
1. **Pre-Enrolled School Identity**: Students, parents, and coaches already exist in the school's administrative database (`schoolRegistry`) before ever accessing StudentOS.
2. **Identity Verification & Activation**:
   ```
   School Registry Record Pre-Exists (Students, Parents, Coaches)
             │
             ▼
   User Selects "Activate Account" & Registration Role
   (Selection only determines which verification form appears; NOT the role)
             │
             ▼
   User Enters Legal Identity Information (Student ID, DOB, Child ID, or Staff Access Code)
             │
             ▼
   Server Securely Verifies Pre-Enrolled School Registry (/api/auth/verify-activation)
             │
             ├── Match Not Found ───► Deny: "No matching school registry record found"
             │
             ├── Already Activated ──► Deny: "This record has already been activated"
             │
             ▼
   Pre-Enrolled Record Confirmed Pending Activation
             │
             ▼
   Create / Link Firebase Authentication User
             │
             ▼
   Connect Firebase UID to School Identity (/users/{uid})
             │
             ▼
   Authoritative Role Derived EXCLUSIVELY from School Database
             │
             ▼
   Route to Verified Role Dashboard (Student, Parent, or Coach)
   ```

3. **Explore the Demo**: Separate instant-entry pathway allowing recruiters and evaluators to test all three roles immediately without creating an account.

---

## 3. Technology Stack & Firebase Services

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide icons, Vite SPA.
- **Backend API**: Express on Node.js running Vite middleware in dev (`server.ts`).
- **Firebase Authentication**:
  - Email & Password accounts with Sign In, Sign Up, and Password Reset.
  - Anonymous Authentication for instant 1-click recruiter demo exploration (`Try as Student`, `Try as Parent`, `Try as Coach`).
  - Persistent session management with `onAuthStateChanged`.
- **Cloud Firestore**:
  - Persistent document storage across users, students, subcollections (assessments, assignments, training, topics, weekly plans), and curriculum materials.
  - Granular `firestore.rules` deployed to the Firebase project.
- **AI Engine**: Gemini 3.8 Flash (`@google/genai` TypeScript SDK) executing through server-side proxy routes with strict JSON validation and course grounding.
- **Deployment**: Firebase-compatible containerized hosting on Google Cloud Run.

---

## 4. Firestore Collections & Data Model

- `/users/{userId}`: User profiles containing `id`, `name`, `email`, `role` (`student` | `parent` | `coach`), and `linkedStudentIds`.
- `/students/{studentId}`: Student master profile, grade, sport, GPA, and computed attention indicators.
  - `/students/{studentId}/subjects/{subjectId}`: Enrolled courses and teachers.
  - `/students/{studentId}/topics/{topicId}`: Topic-level mastery percentages and assessment status.
  - `/students/{studentId}/assignments/{assignmentId}`: Title, due date, completion status, estimated minutes.
  - `/students/{studentId}/assessments/{assessmentId}`: Upcoming and graded exams, dates, weights, importance.
  - `/students/{studentId}/trainingSessions/{sessionId}`: Athletic workouts, sport, duration, intensity (`Light` | `Moderate` | `High`).
  - `/students/{studentId}/weeklyPlans/{planId}`: Balanced daily schedule blocks with reasoning.
- `/courseMaterials/{materialId}`: Textbook chapters and key concepts used for AI Tutor retrieval-augmented grounding.

---

## 5. Authentication Flow & Role-Based Authorization

1. **Authentication Gate**:
   - The entry screen is a clean authentication interface.
   - Users can authenticate with Email/Password or click **Explore the Demo**:
     - **Try as Student**: Enters as **Maya Patel** (Grade 11, Track & Field).
     - **Try as Parent**: Enters as **Priya Patel** (Maya's parent).
     - **Try as Coach**: Enters as **Coach Marcus Reed** (coach managing 10 student-athletes).
2. **Session Persistence**:
   - Authentication state is tracked via `onAuthStateChanged`.
   - On page refresh, the user's role profile is retrieved from Firestore and routes to their protected dashboard.
3. **Data-Layer Enforcement**:
   - `firestore.rules` prevents students from reading peer private records.
   - Parents are strictly restricted to their linked children.
   - User profile documents block client-side role modifications (`request.resource.data.role == resource.data.role`) to eliminate privilege escalation.

---

## 6. Coach & Staff Data Management (CRUD)

From the Coach & Guide Command Center:
- **Roster & Attention Overview**: Lists all 10 student-athletes with computed Academic Status, Training Load, Overall Workload, and Attention Indicators.
- **Student Profile Modal**:
  - Detailed diagnostic explaining why the student was flagged.
  - **Add Assessment**: Schedule an upcoming test or enter a completed score; updates topic risk.
  - **Add Assignment**: Log coursework deliverables with due dates and estimated completion time.
  - **Update Mastery**: Directly modify curriculum topic percentages (e.g. increase Geometry from 64% to 75%).
  - **Add Training Session**: Schedule practices or conditioning with intensity levels.
  - **Delete Records**: Confirmed deletion with confirmation prompts.
  - **Real-Time Recalculation**: Any change automatically triggers `syncStudentAttentionStatus`, immediately updating the student document and refreshing the roster.

---

## 7. AI Features & Safety Approach

### A. Student Balance Agent
- **Academics + Athletics Coordinator**: Reasons over academic mastery, test dates, and athletic intensity.
- **Explainability ("Why this plan?")**: Explains schedule reasoning using structured facts (e.g. Geometry exam Thursday, high-intensity workouts Tuesday/Wednesday, Monday low-fatigue revision window).
- **Conversational Modifications**:
  - Student asks: *"Move my Monday Geometry session to Wednesday."*
  - The agent inspects Wednesday, identifies the 90-minute lactate threshold workout, warns the student of fatigue risks, and requires confirmation:
    `[Confirm Move to Wednesday]` `[Move to Tuesday Instead]` `[Cancel]`.
  - Only after confirmation is the change written to Firestore.

### B. AI Academic Tutor
- Contextual tutor grounded in official course materials stored in Firestore.
- Displays a dedicated **"Sources used"** section.
- **Hallucination Resistance**: Refuses to invent nonexistent exam dates or courses (e.g., Chemistry exam queries return that no record exists).

### C. AI Parent Copilot
- Answers parent inquiries about their child's week.
- Strictly partitions outputs into:
  - **FACTS**: Verifiable stored records (*"Geometry mastery is 64%", "Exam Thursday"*).
  - **OBSERVATIONS**: Contextual analytical insights (*"Tuesday/Wednesday feature peak training demands"*).
  - **SUGGESTIONS**: Practical parenting actions (*"Encourage Monday review and prioritize rest Wednesday night"*).

---

## 8. Deterministic Attention System

Status is calculated using deterministic application logic, never left to LLM guesswork:
- **ATTENTION**:
  - Topic mastery below 70% threshold
  - Upcoming assessment in a weak topic
  - Overdue assignments blocking eligibility
  - Severe training and academic overlap
- **WATCH**:
  - High training volume (14+ hrs/wk)
  - Approaching deadline clusters
- **ON TRACK**:
  - Balanced training and healthy topic mastery (>= 80%)

---

## 9. AI Evaluation Suite (16 Test Cases)

Accessible via the **"AI Evaluations"** button in the navigation bar:
- Automates 16 deterministic tests across 7 dimensions:
  1. *Correct Student Context*
  2. *Correct Factual Answers*
  3. *Hallucination Resistance*
  4. *Authorization & Privacy (RBAC cross-student blocking)*
  5. *Structured Output Validity (tripartite schema enforcement)*
  6. *Correct Agent Action (conflict warning & confirmation gates)*
  7. *Correct Weekly-Plan Reasoning*

---

## 10. Local Setup & Execution

### Prerequisites
- Node.js 20+
- An AI Studio API Key (`GEMINI_API_KEY`)

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Set GEMINI_API_KEY="your_gemini_api_key"

# 3. Start development server (serves frontend + backend proxy on port 3000)
npm run dev
```

Visit `http://localhost:3000` to interact with StudentOS.
