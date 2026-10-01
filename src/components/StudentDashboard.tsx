import React, { useState, useEffect } from 'react';
import {
  Student,
  Subject,
  Topic,
  Assignment,
  Assessment,
  TrainingSession,
  WeeklyPlan,
  WeeklyPlanItem,
  CourseMaterial,
  TutorMessage,
  ProposedPlanModification,
} from '../types';
import {
  getStudentTopics,
  getStudentAssignments,
  getStudentAssessments,
  getStudentTraining,
  getStudentWeeklyPlan,
  updateStudentWeeklyPlan,
  getCourseMaterials,
} from '../lib/studentService';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  BookOpen,
  Dumbbell,
  Sparkles,
  Info,
  ChevronRight,
  Send,
  HelpCircle,
  TrendingUp,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface StudentDashboardProps {
  student: Student;
  onOpenEvaluations: () => void;
}

type TabType = 'overview' | 'academics' | 'schedule' | 'tutor' | 'agent';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  onOpenEvaluations,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [training, setTraining] = useState<TrainingSession[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Tutor State
  const [tutorSubject, setTutorSubject] = useState('Mathematics');
  const [tutorTopic, setTutorTopic] = useState('Geometry');
  const [tutorInput, setTutorInput] = useState('');
  const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>([
    {
      id: 'init_1',
      sender: 'tutor',
      text: `Hello ${student.name.split(' ')[0]}. I'm your StudentOS Academic Tutor. What would you like to review or explore today?`,
      timestamp: 'Just now',
    },
  ]);
  const [tutorLoading, setTutorLoading] = useState(false);

  // Balance Agent State
  const [agentInput, setAgentInput] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentHistory, setAgentHistory] = useState<Array<{ sender: 'student' | 'agent'; text: string; why?: string }>>([
    {
      sender: 'agent',
      text: 'Welcome back Maya. Your schedule for this week is optimized to balance your Thursday Geometry exam with your Tuesday/Wednesday high-intensity track training.',
    },
  ]);
  const [pendingChange, setPendingChange] = useState<ProposedPlanModification | null>(null);
  const [showWhyModal, setShowWhyModal] = useState(false);

  // Load student data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [top, asg, asm, trn, plan, mats] = await Promise.all([
          getStudentTopics(student.id),
          getStudentAssignments(student.id),
          getStudentAssessments(student.id),
          getStudentTraining(student.id),
          getStudentWeeklyPlan(student.id),
          getCourseMaterials(),
        ]);
        setTopics(top);
        setAssignments(asg);
        setAssessments(asm);
        setTraining(trn);
        setWeeklyPlan(plan);
        setCourseMaterials(mats);
      } catch (err) {
        console.error('Failed to load student data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [student.id]);

  const avgMastery =
    topics.length > 0
      ? (topics.reduce((acc, t) => acc + t.masteryPercentage, 0) / topics.length).toFixed(1)
      : '84.2';

  const lowestTopic = [...topics].sort((a, b) => a.masteryPercentage - b.masteryPercentage)[0];
  const nextAssessment = assessments[0];

  const groupedTopics: Record<string, Topic[]> = {};
  topics.forEach((top) => {
    const subj = top.subjectName || 'General';
    if (!groupedTopics[subj]) groupedTopics[subj] = [];
    groupedTopics[subj].push(top);
  });

  // Toggle assignment status
  const handleToggleAssignment = (asgId: string) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === asgId
          ? { ...a, status: a.status === 'completed' ? 'pending' : 'completed' }
          : a
      )
    );
  };

  // Group topics by subject
  const availableSubjects =
    Object.keys(groupedTopics).length > 0
      ? Object.keys(groupedTopics)
      : ['Mathematics', 'Science', 'English', 'General'];

  const handleTutorSubjectChange = (newSubj: string) => {
    setTutorSubject(newSubj);
    const subTopics = groupedTopics[newSubj];
    if (subTopics && subTopics.length > 0) {
      setTutorTopic(subTopics[0].name);
    } else {
      setTutorTopic('General');
    }
  };

  // AI Tutor Send
  const handleSendTutor = async (customPrompt?: string) => {
    const q = customPrompt || tutorInput.trim();
    if (!q || tutorLoading) return;

    const userMsg: TutorMessage = {
      id: Date.now().toString(),
      sender: 'student',
      text: q,
      timestamp: 'Just now',
    };
    setTutorMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setTutorInput('');
    setTutorLoading(true);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${student.id}`,
        },
        body: JSON.stringify({
          studentId: student.id,
          userRole: 'student',
          authUserId: student.id,
          subject: tutorSubject,
          topic: tutorTopic,
          question: q,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'AI Tutor is temporarily unavailable. Please try again.');
      }

      const data = await res.json();
      const botMsg: TutorMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'tutor',
        text: data.text || 'Explanation unavailable at this moment.',
        sources: Array.isArray(data.sources) && data.sources.length > 0 ? data.sources : undefined,
        timestamp: 'Just now',
      };
      setTutorMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Tutor call error:', err);
      setTutorMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'tutor',
          text: err.message || 'AI Tutor is temporarily unavailable. Please try again.',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setTutorLoading(false);
    }
  };

  // Balance Agent Send
  const handleSendAgent = async (customPrompt?: string) => {
    const msg = customPrompt || agentInput.trim();
    if (!msg || agentLoading) return;

    setAgentHistory((prev) => [...prev, { sender: 'student', text: msg }]);
    if (!customPrompt) setAgentInput('');
    setAgentLoading(true);

    try {
      const res = await fetch('/api/ai/balance-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          userRole: 'student',
          message: msg,
          currentPlan: weeklyPlan,
          trainingSchedule: training,
          upcomingAssessments: assessments,
          upcomingAssignments: assignments,
          masteryContext: topics,
        }),
      });

      const data = await res.json();
      setAgentHistory((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: data.message,
          why: data.reasoning,
        },
      ]);

      if (data.requiresConfirmation && data.proposedChange) {
        setPendingChange(data.proposedChange);
      } else {
        setPendingChange(null);
      }
    } catch (err) {
      console.error('Balance agent error:', err);
      setAgentHistory((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: 'AI features are temporarily unavailable. Your student dashboard and weekly schedule remain active.',
        },
      ]);
    } finally {
      setAgentLoading(false);
    }
  };

  // Confirm conversational plan change
  const handleConfirmChange = async (targetDay?: string) => {
    if (!pendingChange || !weeklyPlan) return;

    const toDay = targetDay || pendingChange.toDay;
    const fromDay = pendingChange.fromDay;

    // Mutate the items list
    const updatedItems: WeeklyPlanItem[] = weeklyPlan.items.map((item) => {
      if (item.dayOfWeek === fromDay && item.title.includes('Geometry')) {
        return {
          ...item,
          dayOfWeek: toDay as any,
          reason: `Rescheduled from ${fromDay} to ${toDay} per student confirmation.`,
        };
      }
      return item;
    });

    try {
      const newPlan = await updateStudentWeeklyPlan(
        student.id,
        updatedItems,
        `Student confirmed moving Geometry study block from ${fromDay} to ${toDay}.`
      );
      setWeeklyPlan(newPlan);
      setAgentHistory((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: `Plan updated! Your Geometry study block has been moved to ${toDay}. Firestore record synchronized.`,
        },
      ]);
      setPendingChange(null);
    } catch (err) {
      console.error('Failed to update plan in Firestore:', err);
    }
  };

  const handleCancelChange = () => {
    setPendingChange(null);
    setAgentHistory((prev) => [
      ...prev,
      {
        sender: 'agent',
        text: 'Change cancelled. Your weekly balance schedule remains in its original recommended configuration.',
      },
    ]);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E293B] mb-3"></div>
        <p className="text-xs text-[#64748B]">Loading student records from Firestore...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Student Banner */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 mb-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-[#1A1A1A]">{student.name}</h1>
              <span className="text-xs text-[#64748B] font-mono px-2 py-0.5 bg-[#F1F5F9] rounded">
                {student.grade}
              </span>
              <span className="text-xs text-[#64748B] px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                {student.sport}
              </span>
            </div>
            <p className="text-xs text-[#525252] mt-1.5 leading-relaxed">
              Track & Field student-athlete. Prioritizing Thursday Geometry Exam (64%) alongside peak interval workouts on Tuesday and Wednesday.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#B45309]" />
              Geometry Assessment Thursday
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto space-x-1 border-t border-[#F1F5F9] mt-5 pt-3">
          {[
            { id: 'overview', label: 'Overview', icon: Calendar },
            { id: 'academics', label: 'Academics & Mastery', icon: BookOpen },
            { id: 'schedule', label: 'Weekly Schedule', icon: Clock },
            { id: 'tutor', label: 'AI Tutor', icon: Sparkles },
            { id: 'agent', label: 'Balance Agent', icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1E293B] text-white'
                    : 'text-[#525252] hover:text-[#1A1A1A] hover:bg-[#F1F5F9]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW (Answers the 4 Core Questions Immediately)
         ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* The 4 Core Questions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Question 1: How am I doing? */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">
                1. How am I doing?
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-2xl font-bold text-[#1A1A1A]">{avgMastery}%</div>
                <span className="text-xs font-medium text-[#1E293B] bg-[#F1F5F9] px-2 py-0.5 rounded">
                  GPA {student.overallGpa}
                </span>
              </div>
              <p className="text-xs text-[#525252] mt-2 leading-relaxed">
                Overall solid standing across curriculum. {lowestTopic ? `${lowestTopic.name} is currently at ${lowestTopic.masteryPercentage}%.` : ''}
              </p>
            </div>

            {/* Question 2: What needs my attention? */}
            <div className="bg-white border border-[#FDE68A] bg-[#FFFDF5] rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-[#B45309] uppercase">
                  2. What needs attention?
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
              </div>
              <div className="mt-2 text-sm font-semibold text-[#92400E]">
                {nextAssessment ? `${nextAssessment.title} (${nextAssessment.date})` : 'All caught up'}
              </div>
              <p className="text-xs text-[#78350F] mt-1.5 leading-relaxed">
                {lowestTopic
                  ? `${lowestTopic.name} mastery is at ${lowestTopic.masteryPercentage}%. Tue & Wed have heavy workouts, making Monday prime for focus.`
                  : 'No critical attention signals detected.'}
              </p>
            </div>

            {/* Question 3: What do I need to do next? */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">
                3. What to do next?
              </span>
              <div className="mt-2 text-sm font-semibold text-[#1A1A1A]">
                Monday 45m Focus Block
              </div>
              <p className="text-xs text-[#525252] mt-1.5 leading-relaxed">
                Deep review scheduled for Monday afternoon right after aerobic practice.
              </p>
              <button
                onClick={() => setActiveTab('tutor')}
                className="mt-3 inline-flex items-center text-xs font-medium text-[#1E293B] hover:underline cursor-pointer"
              >
                <span>Launch AI Tutor</span>
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {/* Question 4: What does my week look like? */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">
                4. Week at a glance
              </span>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-[#1A1A1A]">{training.length} Athletics / {assessments.length} Tests</div>
              </div>
              <div className="mt-2 flex space-x-1">
                {['M', 'T', 'W', 'T', 'F'].map((day, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 text-center py-1 rounded text-[10px] font-medium ${
                      idx === 3
                        ? 'bg-[#FEF3C7] text-[#92400E] font-bold border border-[#FDE68A]'
                        : idx === 1 || idx === 2
                        ? 'bg-[#E2E8F0] text-[#334155]'
                        : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#64748B] mt-2">
                Thu: Exam Day • Tue/Wed: Heavy Training
              </p>
            </div>
          </div>

          {/* Attention Insight Banner */}
          <div className="bg-white border-l-4 border-amber-500 border-y border-r border-[#E5E7EB] rounded-lg p-4 shadow-2xs">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h2 className="text-xs font-semibold text-[#1A1A1A]">
                    Key Attention Signal: Academic & Athletic Coordination
                  </h2>
                  <button
                    onClick={() => setShowWhyModal(true)}
                    className="inline-flex items-center text-xs text-[#1E293B] hover:underline font-medium cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 mr-1" />
                    Why this plan?
                  </button>
                </div>
                <p className="text-xs text-[#525252] mt-1 leading-relaxed">
                  {student.attentionReason}
                </p>
              </div>
            </div>
          </div>

          {/* Two Column Section: Quick Tasks + Weekly Schedule Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Upcoming Deliverables */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
                  Upcoming Work & Tests
                </h2>
                <span className="text-[11px] text-[#64748B]">Next 7 Days</span>
              </div>
              <div className="space-y-3">
                {assessments.length === 0 && assignments.length === 0 ? (
                  <p className="text-[11px] text-[#64748B] py-6 text-center border border-dashed border-[#E2E8F0] rounded-lg">
                    No upcoming assessments or work.
                  </p>
                ) : (
                  <>
                    {assessments.slice(0, 2).map((asm) => (
                      <div key={asm.id} className="p-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#92400E]">{asm.title}</span>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded">
                            {asm.date}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#78350F] mt-1">
                          {asm.subjectName} • Topic: {asm.topicName} • Weight: {asm.weight}
                        </p>
                      </div>
                    ))}
                    {assignments.slice(0, 2).map((asg) => (
                      <div key={asg.id} className="p-3 rounded-lg border border-[#E2E8F0] bg-white">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#1A1A1A]">{asg.title}</span>
                          <span className="text-[10px] text-[#64748B] px-1.5 py-0.5 bg-[#F1F5F9] rounded">
                            {asg.dueDate}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-1">
                          {asg.subjectName} • Est: {asg.estimatedMinutes}m
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Right: Balanced Week Preview */}
            <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
                  Balanced Schedule (Academics + Training)
                </h2>
                <button
                  onClick={() => setActiveTab('agent')}
                  className="text-xs text-[#1E293B] font-medium hover:underline flex items-center"
                >
                  <span>Open Balance Agent</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>

              <div className="space-y-2.5">
                {weeklyPlan?.items.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-[#F1F5F9] bg-[#FAFAFA] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-16 font-semibold text-[#475569]">{item.dayOfWeek}</div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          item.type === 'academic_study'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : item.type === 'assessment'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {item.type === 'academic_study'
                          ? 'Study'
                          : item.type === 'assessment'
                          ? 'Exam'
                          : 'Athletics'}
                      </span>
                      <span className="font-medium text-[#1A1A1A]">{item.title}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-[#64748B]">
                      <span>{item.durationMinutes}m</span>
                      <span className="hidden sm:inline text-[11px] text-[#525252] max-w-xs truncate">
                        {item.reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ACADEMIC MASTERY
         ========================================================================= */}
      {activeTab === 'academics' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Academic Mastery Breakdown</h2>
            <p className="text-xs text-[#525252] mt-1">
              Curriculum mastery scored across topics based on homework, quizzes, and formative assessments.
            </p>

            {topics.length === 0 ? (
              <div className="p-8 text-center text-[#64748B] mt-4 border border-dashed border-[#CBD5E1] rounded-lg">
                Academic progress has not been added yet.
              </div>
            ) : (
              Object.entries(groupedTopics).map(([subject, subTopics]) => (
                <div key={subject} className="mt-6 border-t border-[#F1F5F9] pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm text-[#1A1A1A]">{subject}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-[#F1F5F9] text-[#1E293B] rounded">
                      Average: {(subTopics.reduce((a, b) => a + b.masteryPercentage, 0) / subTopics.length).toFixed(0)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {subTopics.map((top) => {
                      const isWeak = top.masteryPercentage < 70;
                      const isStrong = top.masteryPercentage >= 80;
                      return (
                        <div
                          key={top.id}
                          className={`p-3.5 rounded-lg border ${
                            isWeak ? 'border-[#FDE68A] bg-[#FFFDF5]' : 'border-[#E5E7EB] bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className={`font-medium ${isWeak ? 'text-[#92400E]' : 'text-[#1A1A1A]'}`}>
                              {top.name}
                            </span>
                            <span
                              className={`font-bold ${
                                isWeak
                                  ? 'text-amber-700'
                                  : isStrong
                                  ? 'text-emerald-700'
                                  : 'text-blue-700'
                              }`}
                            >
                              {top.masteryPercentage}%
                            </span>
                          </div>
                          <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                isWeak
                                  ? 'bg-amber-600'
                                  : isStrong
                                  ? 'bg-emerald-600'
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${top.masteryPercentage}%` }}
                            ></div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                isWeak
                                  ? 'text-amber-800 bg-amber-100'
                                  : isStrong
                                  ? 'text-emerald-800 bg-emerald-50'
                                  : 'text-blue-800 bg-blue-50'
                              }`}
                            >
                              {isWeak ? 'Needs Attention' : isStrong ? 'Strong' : 'Proficient'}
                            </span>
                            {isWeak && (
                              <button
                                onClick={() => {
                                  setTutorTopic(top.name);
                                  setTutorSubject(subject);
                                  setActiveTab('tutor');
                                }}
                                className="text-[10px] text-[#1E293B] font-semibold hover:underline cursor-pointer"
                              >
                                Study with AI Tutor →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: SCHEDULE & WORKLOAD
         ========================================================================= */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Training Overview */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Athletic Training Load</h2>
            <p className="text-xs text-[#525252] mt-1">
              Synchronized from varsity track coaching system. Peak intensity occurs Tuesday and Wednesday.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-4">
              {training.map((t) => (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-lg border ${
                    t.intensity === 'High'
                      ? 'border-indigo-200 bg-indigo-50/50'
                      : t.intensity === 'Moderate'
                      ? 'border-[#E2E8F0] bg-white'
                      : 'border-[#E2E8F0] bg-[#FAFAFA]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#1A1A1A]">{t.dayOfWeek}</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        t.intensity === 'High'
                          ? 'bg-indigo-100 text-indigo-800'
                          : t.intensity === 'Moderate'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {t.intensity}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-[#1A1A1A] mt-1.5">{t.durationMinutes} min</div>
                  <p className="text-[11px] text-[#64748B] mt-1 leading-snug">{t.notes}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Assignments Checklist */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Assignments & Assessments</h2>
            <p className="text-xs text-[#525252] mt-1">
              Click checkboxes to mark work completed. Cloud Firestore maintains persistent status.
            </p>

            <div className="mt-4 space-y-2.5">
              {assignments.map((asg) => (
                <div
                  key={asg.id}
                  onClick={() => handleToggleAssignment(asg.id)}
                  className={`p-3.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                    asg.status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50/40 text-[#64748B]'
                      : 'border-[#E2E8F0] bg-white hover:border-[#1E293B]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={asg.status === 'completed'}
                      onChange={() => handleToggleAssignment(asg.id)}
                      className="w-4 h-4 text-[#1E293B] rounded focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p
                        className={`text-xs font-medium ${
                          asg.status === 'completed'
                            ? 'line-through text-[#64748B]'
                            : 'text-[#1A1A1A]'
                        }`}
                      >
                        {asg.title}
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        {asg.subjectName} • Due: {asg.dueDate} • Est. {asg.estimatedMinutes}m
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                      asg.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {asg.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: AI TUTOR (Grounded in course materials & student context)
         ========================================================================= */}
      {activeTab === 'tutor' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#F1F5F9] gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#1E293B]" />
                <h2 className="text-base font-semibold text-[#1A1A1A]">AI Academic Tutor</h2>
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  Grounded in Curriculum
                </span>
              </div>
              <p className="text-xs text-[#525252] mt-1">
                {topics.length > 0 && lowestTopic
                  ? `Contextual tutor grounded in official course materials. Focus topic: ${lowestTopic.name} (${lowestTopic.masteryPercentage}%).`
                  : 'Contextual tutor grounded in official course materials.'}
              </p>
            </div>

            {/* Subject / Topic selector */}
            <div className="flex items-center space-x-2 text-xs">
              <select
                value={tutorSubject}
                onChange={(e) => handleTutorSubjectChange(e.target.value)}
                disabled={tutorLoading}
                className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-2.5 py-1.5 text-xs text-[#1E293B]"
              >
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={tutorTopic}
                onChange={(e) => setTutorTopic(e.target.value)}
                disabled={tutorLoading}
                className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-2.5 py-1.5 text-xs text-[#1E293B]"
              >
                {(groupedTopics[tutorSubject] || []).length > 0 ? (
                  (groupedTopics[tutorSubject] || []).map((top) => (
                    <option key={top.id} value={top.name}>
                      {top.name} ({top.masteryPercentage}%)
                    </option>
                  ))
                ) : (
                  <option value={tutorTopic || 'General'}>{tutorTopic || 'General'}</option>
                )}
              </select>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="py-3 flex flex-wrap gap-2 border-b border-[#F1F5F9]">
            <span className="text-[11px] text-[#64748B] self-center">Try asking:</span>
            {[
              'Explain the Inscribed Angle Theorem simply',
              'What formula should I use for arc length on my test?',
              'Can you give me a practice problem on cyclic quadrilaterals?',
              'When is my Chemistry exam scheduled?',
            ].map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendTutor(qp)}
                className="text-[11px] px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="h-80 overflow-y-auto py-4 space-y-4">
            {tutorMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'student' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-xl rounded-xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'student'
                      ? 'bg-[#1E293B] text-white'
                      : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#1A1A1A]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Sources Used Section */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1 flex items-center space-x-1.5 text-[10px] text-[#64748B] px-1">
                    <BookOpen className="w-3 h-3 text-[#64748B]" />
                    <span>Sources used: {msg.sources.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
            {tutorLoading && (
              <div className="flex items-center space-x-2 text-xs text-[#64748B] py-2">
                <div className="w-2 h-2 rounded-full bg-[#1E293B] animate-ping"></div>
                <span>Thinking...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="mt-2 pt-3 border-t border-[#F1F5F9] flex items-center space-x-2">
            <input
              type="text"
              value={tutorInput}
              disabled={tutorLoading}
              onChange={(e) => setTutorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendTutor();
                }
              }}
              placeholder="Ask a question about circle theorems, proofs, or formulas..."
              className="flex-1 bg-[#FAF9F6] border border-[#E2E8F0] rounded-lg px-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B] disabled:opacity-50"
            />
            <button
              onClick={() => handleSendTutor()}
              disabled={tutorLoading || !tutorInput.trim()}
              className="p-2.5 bg-[#1E293B] text-white rounded-lg hover:bg-[#0F172A] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: STUDENT BALANCE AGENT (Main Feature: Actionable + Conversational Changes)
         ========================================================================= */}
      {activeTab === 'agent' && (
        <div className="space-y-6">
          {/* Header Explanation */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#F1F5F9] gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-[#1E293B]" />
                  <h2 className="text-base font-semibold text-[#1A1A1A]">Student Balance Agent</h2>
                  <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium border border-indigo-200">
                    Academics + Athletics Coordinator
                  </span>
                </div>
                <p className="text-xs text-[#525252] mt-1 leading-relaxed">
                  Reasoning engine balancing your academic deadlines against physical fatigue. Modifies your schedule conversationally with safety confirmations.
                </p>
              </div>

              <button
                onClick={() => setShowWhyModal(true)}
                className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-md bg-[#F8FAFC] border border-[#CBD5E1] text-[#1E293B] hover:bg-[#F1F5F9]"
              >
                <HelpCircle className="w-3.5 h-3.5 mr-1 text-[#64748B]" />
                Why this plan?
              </button>
            </div>

            {/* Quick Agent Actions */}
            <div className="py-3 flex flex-wrap gap-2 border-b border-[#F1F5F9]">
              <span className="text-[11px] text-[#64748B] self-center">Try asking the agent:</span>
              {[
                'Why is my deep study block placed on Monday?',
                'Move my Monday Geometry session to Wednesday',
                'How can I lighten Tuesday after interval practice?',
              ].map((act, i) => (
                <button
                  key={i}
                  onClick={() => handleSendAgent(act)}
                  className="text-[11px] px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                >
                  {act}
                </button>
              ))}
            </div>

            {/* Conversation Log */}
            <div className="h-64 overflow-y-auto py-3 space-y-3">
              {agentHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${item.sender === 'student' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-xl rounded-xl p-3 text-xs leading-relaxed ${
                      item.sender === 'student'
                        ? 'bg-[#1E293B] text-white'
                        : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#1A1A1A]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{item.text}</p>
                    {item.why && (
                      <div className="mt-2 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
                        <span className="font-semibold text-[#1A1A1A]">Reasoning: </span>
                        {item.why}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {agentLoading && (
                <div className="text-xs text-[#64748B] flex items-center space-x-2 py-1">
                  <div className="w-2 h-2 rounded-full bg-slate-800 animate-ping"></div>
                  <span>Agent is analyzing workload and training constraints...</span>
                </div>
              )}
            </div>

            {/* Action Confirmation Banner (If conversational change staged) */}
            {pendingChange && (
              <div className="mt-4 p-4 rounded-xl border border-amber-300 bg-amber-50 shadow-2xs">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-amber-900">
                      Workload Overlap Detected: Confirmation Required
                    </h3>
                    <p className="text-xs text-amber-800 mt-1">
                      You requested moving <strong>{pendingChange.itemTitle}</strong> from{' '}
                      <strong>{pendingChange.fromDay}</strong> to <strong>{pendingChange.toDay}</strong>.
                    </p>
                    {pendingChange.riskWarning && (
                      <p className="text-xs text-amber-900 font-medium mt-1">
                        ⚠️ {pendingChange.riskWarning}
                      </p>
                    )}

                    {/* Action Buttons: Confirm, Choose Another Time, Cancel */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleConfirmChange()}
                        className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-md text-xs font-medium cursor-pointer"
                      >
                        Confirm Move to {pendingChange.toDay}
                      </button>
                      <button
                        onClick={() => handleConfirmChange('Tuesday')}
                        className="px-3 py-1.5 bg-white border border-amber-400 text-amber-900 hover:bg-amber-100 rounded-md text-xs font-medium cursor-pointer"
                      >
                        Move to Tuesday Evening (Lighter)
                      </button>
                      <button
                        onClick={handleCancelChange}
                        className="px-3 py-1.5 text-xs text-amber-800 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Agent Input */}
            <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center space-x-2">
              <input
                type="text"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAgent()}
                placeholder="e.g., 'Move my Monday Geometry session to Wednesday' or 'Why this plan?'"
                className="flex-1 bg-[#FAF9F6] border border-[#E2E8F0] rounded-lg px-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B]"
              />
              <button
                onClick={() => handleSendAgent()}
                disabled={agentLoading || !agentInput.trim()}
                className="p-2.5 bg-[#1E293B] text-white rounded-lg hover:bg-[#0F172A] disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current Weekly Schedule Items */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">
                Synchronized Weekly Plan (Cloud Firestore)
              </h3>
              <span className="text-[11px] text-[#64748B]">Updated live</span>
            </div>

            <div className="space-y-2.5">
              {weeklyPlan?.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border border-[#F1F5F9] bg-[#FAFAFA] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-20 font-semibold text-xs text-[#334155]">{item.dayOfWeek}</span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        item.type === 'academic_study'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : item.type === 'assessment'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-medium text-[#1A1A1A]">{item.title}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-[#64748B]">
                    <span>{item.durationMinutes} min</span>
                    <span className="text-[11px] text-[#525252]">{item.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* "Why this plan?" Explainability Modal */}
      {showWhyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-[#1E293B]" />
                <h3 className="text-base font-semibold text-[#1A1A1A]">Why this plan?</h3>
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                className="text-xs text-[#64748B] hover:text-[#1A1A1A]"
              >
                ✕ Close
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-[#475569] leading-relaxed">
              <p className="font-medium text-[#1A1A1A]">
                The Student Balance Agent constructs your weekly schedule using structured database facts:
              </p>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1.5 font-mono text-[11px]">
                <div>• Geometry Mastery: 64% (Academic deficit)</div>
                <div>• Assessment: Thursday morning (High urgency)</div>
                <div>• Tuesday Training: High Intensity (75m intervals)</div>
                <div>• Wednesday Training: High Intensity (90m lactate tempo)</div>
                <div>• Monday Training: Moderate (45m aerobic base)</div>
              </div>

              <p>
                <strong>The Strategy:</strong> Wednesday night studying produces poor retention when combined with 90 minutes of peak athletic training. Scheduling your 45-minute deep focus block on <strong>Monday afternoon</strong> maximizes cognitive retention while keeping Tuesday and Wednesday nights reserved for light formula checks (20m) and physical recovery.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowWhyModal(false)}
                className="px-4 py-2 bg-[#1E293B] text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
