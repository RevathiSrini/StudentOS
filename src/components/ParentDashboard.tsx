import React, { useState, useEffect } from 'react';
import {
  Student,
  Subject,
  Topic,
  Assignment,
  Assessment,
  TrainingSession,
  ParentCopilotResponse,
  UserProfile,
} from '../types';
import {
  getStudentById,
  getStudentTopics,
  getStudentAssignments,
  getStudentAssessments,
  getStudentTraining,
} from '../lib/studentService';
import {
  HeartHandshake,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  BookOpen,
  Calendar,
  Send,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ParentDashboardProps {
  currentUser: UserProfile;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ currentUser }) => {
  const linkedStudentId = currentUser.linkedStudentIds?.[0] || 'student_maya_patel';

  const [student, setStudent] = useState<Student | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [training, setTraining] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Parent Copilot State
  const [questionInput, setQuestionInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResponse, setCopilotResponse] = useState<ParentCopilotResponse | null>({
    facts: [
      'Geometry mastery is currently 64% in Mathematics.',
      'Upcoming assessment: Geometry Unit 4 Exam scheduled for Thursday.',
      'Upcoming assignment: Electric Circuit Analysis Problem Set due Friday.',
      'Athletic training: Monday (45m Moderate), Tuesday (75m High), Wednesday (90m High), Friday (60m Moderate).',
    ],
    observations: [
      'Geometry is Maya’s lowest topic score compared to Algebra (88%) and Science Mechanics (91%).',
      'Tuesday and Wednesday have peak athletic training volume (165 minutes total).',
      'Monday afternoon is the best low-fatigue window for focused Geometry study before heavy training days.',
    ],
    suggestions: [
      'Ask Maya how her 45-minute Geometry study session went on Monday evening.',
      'Ensure she gets good sleep Tuesday and Wednesday nights to balance heavy track workouts.',
      'Remind her that Thursday evening is scheduled for mental recovery after the exam.',
    ],
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [stu, top, asg, asm, trn] = await Promise.all([
          getStudentById(linkedStudentId),
          getStudentTopics(linkedStudentId),
          getStudentAssignments(linkedStudentId),
          getStudentAssessments(linkedStudentId),
          getStudentTraining(linkedStudentId),
        ]);
        setStudent(stu);
        setTopics(top);
        setAssignments(asg);
        setAssessments(asm);
        setTraining(trn);
      } catch (err) {
        console.error('Failed to load child data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [linkedStudentId]);

  const handleAskCopilot = async (customPrompt?: string) => {
    const q = customPrompt || questionInput.trim();
    if (!q || copilotLoading) return;

    setCopilotLoading(true);
    if (!customPrompt) setQuestionInput('');

    try {
      const res = await fetch('/api/ai/parent-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: currentUser.id,
          studentId: linkedStudentId,
          userRole: 'parent',
          question: q,
          studentContext: {
            studentName: student?.name || 'Maya Patel',
            topics,
            assessments,
            assignments,
            training,
          },
        }),
      });

      const data = await res.json();
      if (data.facts && data.observations && data.suggestions) {
        setCopilotResponse(data);
      }
    } catch (err) {
      console.error('Copilot query error:', err);
    } finally {
      setCopilotLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E293B] mb-3"></div>
        <p className="text-xs text-[#64748B]">Loading your child’s records...</p>
      </div>
    );
  }

  const strongTopics = topics.filter((t) => t.masteryPercentage >= 80);
  const supportTopics = topics.filter((t) => t.masteryPercentage < 70);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Privacy Guarantee Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <HeartHandshake className="w-5 h-5 text-[#334155]" />
            <h1 className="text-xl font-semibold text-[#1A1A1A]">
              Parent Dashboard: {student?.name}
            </h1>
            <span className="text-xs text-[#64748B] font-mono bg-[#F1F5F9] px-2 py-0.5 rounded">
              {student?.grade}
            </span>
          </div>
          <p className="text-xs text-[#525252] mt-1 leading-relaxed">
            Authorized private student view. Only records for your linked child ({student?.name}) are accessible.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Private Parent View</span>
        </div>
      </div>

      {/* High-Level Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Academic Standing */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
            Overall Standing
          </span>
          <div className="mt-2 text-2xl font-bold text-[#1A1A1A]">{student?.overallGpa} GPA</div>
          <p className="text-xs text-[#525252] mt-1">
            Strong grades across Science and English; targeted support recommended for Geometry.
          </p>
        </div>

        {/* Academic Attention */}
        <div className="bg-white border border-[#FDE68A] bg-[#FFFDF5] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#92400E] uppercase tracking-wider">
              Focus Area This Week
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-sm font-bold text-[#92400E]">Geometry Exam (Thursday)</div>
          <p className="text-xs text-[#78350F] mt-1">
            Topic mastery is currently 64%. Study session scheduled Monday before heavy training days.
          </p>
        </div>

        {/* Athletic Load */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
            Athletic Demands
          </span>
          <div className="mt-2 text-2xl font-bold text-[#1A1A1A]">High (4 Sessions)</div>
          <p className="text-xs text-[#525252] mt-1">
            Tuesday (75m intervals) and Wednesday (90m tempo) require solid nutrition and sleep.
          </p>
        </div>
      </div>

      {/* Strengths & Support Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Academic Strengths */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <h2 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-3">
            Academic Strengths
          </h2>
          <div className="space-y-2.5">
            {strongTopics.map((top) => (
              <div
                key={top.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAFAFA] border border-[#F1F5F9] text-xs"
              >
                <div>
                  <span className="font-medium text-[#1A1A1A]">{top.name}</span>
                  <span className="text-[11px] text-[#64748B] ml-2">({top.subjectName})</span>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {top.masteryPercentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Areas Needing Support */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <h2 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-3">
            Areas Needing Support
          </h2>
          <div className="space-y-2.5">
            {supportTopics.map((top) => (
              <div
                key={top.id}
                className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-900">{top.name}</span>
                  <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    {top.masteryPercentage}% Mastery
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mt-1">
                  Unit 4 Exam is Thursday. Student Balance Agent has prioritized circle theorem proofs for Monday review.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI FEATURE 2: PARENT COPILOT */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#F1F5F9] gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#1E293B]" />
              <h2 className="text-base font-semibold text-[#1A1A1A]">AI Parent Copilot</h2>
              <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Grounded Child Assistant
              </span>
            </div>
            <p className="text-xs text-[#525252] mt-1">
              Ask questions about Maya’s week. Responses strictly separate verified school Facts, holistic Observations, and practical Suggestions.
            </p>
          </div>
        </div>

        {/* Quick Question Buttons */}
        <div className="py-3 flex flex-wrap gap-2 border-b border-[#F1F5F9]">
          <span className="text-[11px] text-[#64748B] self-center">Quick questions:</span>
          {[
            'How is Maya doing this week?',
            'What needs the most attention?',
            'Does she have anything important coming up?',
            'Is training affecting her school work?',
            'How can I support her this week?',
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => handleAskCopilot(promptText)}
              className="text-[11px] px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Structured Output Container: FACTS | OBSERVATIONS | SUGGESTIONS */}
        {copilotResponse && (
          <div className="mt-4 space-y-4">
            {/* 1. FACTS */}
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-[#1E293B]" />
                <span className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                  Facts (Verified Stored School Records)
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#334155]">
                {copilotResponse.facts.map((fact, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-[#64748B]">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. OBSERVATIONS */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-800" />
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Observations (Contextual Analysis)
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-blue-900">
                {copilotResponse.observations.map((obs, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-blue-500">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. SUGGESTIONS */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center space-x-2 mb-2">
                <HeartHandshake className="w-4 h-4 text-emerald-800" />
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Suggestions (Practical Support Actions)
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-emerald-950">
                {copilotResponse.suggestions.map((sug, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-emerald-600">•</span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {copilotLoading && (
          <div className="py-6 text-center text-xs text-[#64748B]">
            <div className="inline-block w-4 h-4 border-2 border-[#1E293B] border-t-transparent rounded-full animate-spin mr-2"></div>
            Analyzing authorized child data with Gemini...
          </div>
        )}

        {/* Input Form */}
        <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center space-x-2">
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskCopilot()}
            placeholder="Ask about Maya's tests, training schedule, or how to help this week..."
            className="flex-1 bg-[#FAF9F6] border border-[#E2E8F0] rounded-lg px-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B]"
          />
          <button
            onClick={() => handleAskCopilot()}
            disabled={copilotLoading || !questionInput.trim()}
            className="p-2.5 bg-[#1E293B] text-white rounded-lg hover:bg-[#0F172A] disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
