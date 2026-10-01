import React, { useState, useEffect } from 'react';
import {
  Student,
  Topic,
  Assessment,
  Assignment,
  TrainingSession,
  NewAssessmentInput,
  NewAssignmentInput,
  NewTrainingInput,
  UpdateMasteryInput,
  IntensityLevel,
} from '../types';
import {
  getStudentsList,
  getStudentTopics,
  getStudentAssessments,
  getStudentAssignments,
  getStudentTraining,
  addStudentAssessment,
  deleteStudentAssessment,
  addStudentAssignment,
  deleteStudentAssignment,
  updateStudentTopicMastery,
  addStudentTrainingSession,
  deleteStudentTrainingSession,
  syncStudentAttentionStatus,
} from '../lib/studentService';
import {
  Compass,
  AlertTriangle,
  CheckCircle,
  Eye,
  Search,
  BookOpen,
  Dumbbell,
  Clock,
  Sparkles,
  X,
  Plus,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react';

interface CoachDashboardProps {
  onSelectStudentForDetail?: (studentId: string) => void;
}

type ModalSubTab = 'overview' | 'assessments' | 'assignments' | 'mastery' | 'training';

export const CoachDashboard: React.FC<CoachDashboardProps> = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Attention' | 'Watch' | 'On Track'>('All');

  // Detailed Modal inspection state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<ModalSubTab>('overview');
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [selectedAssessments, setSelectedAssessments] = useState<Assessment[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<Assignment[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<TrainingSession[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [coachNote, setCoachNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  // Form Modals
  const [showAddAssessment, setShowAddAssessment] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState<NewAssessmentInput>({
    subjectName: 'Mathematics',
    title: '',
    topicName: 'Geometry',
    date: 'Thursday',
    weight: '20% of Term',
    importance: 'high',
  });

  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState<NewAssignmentInput>({
    subjectName: 'Science',
    title: '',
    dueDate: 'Friday',
    estimatedMinutes: 45,
    notes: '',
  });

  const [showUpdateMastery, setShowUpdateMastery] = useState(false);
  const [masteryForm, setMasteryForm] = useState<UpdateMasteryInput>({
    topicId: '',
    subjectName: '',
    topicName: '',
    masteryPercentage: 70,
  });

  const [showAddTraining, setShowAddTraining] = useState(false);
  const [trainingForm, setTrainingForm] = useState<NewTrainingInput>({
    sport: 'Track & Field',
    dayOfWeek: 'Monday',
    durationMinutes: 60,
    intensity: 'Moderate',
    notes: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<{ type: string; id: string } | null>(null);

  const loadRoster = async () => {
    try {
      const list = await getStudentsList();
      setStudents(list);
    } catch (err) {
      console.error('Failed to load coach roster:', err);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadRoster();
      setLoading(false);
    }
    init();
  }, []);

  const handleOpenStudentDetail = async (student: Student) => {
    setSelectedStudent(student);
    setActiveSubTab('overview');
    setLoadingDetail(true);
    setNoteSaved(false);
    setCoachNote('');
    try {
      const [top, asm, asg, trn] = await Promise.all([
        getStudentTopics(student.id),
        getStudentAssessments(student.id),
        getStudentAssignments(student.id),
        getStudentTraining(student.id),
      ]);
      setSelectedTopics(top);
      setSelectedAssessments(asm);
      setSelectedAssignments(asg);
      setSelectedTraining(trn);
    } catch (err) {
      console.error('Detail fetch error:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const refreshStudentDetails = async (studentId: string) => {
    const [top, asm, asg, trn, updatedStudent] = await Promise.all([
      getStudentTopics(studentId),
      getStudentAssessments(studentId),
      getStudentAssignments(studentId),
      getStudentTraining(studentId),
      syncStudentAttentionStatus(studentId),
    ]);
    setSelectedTopics(top);
    setSelectedAssessments(asm);
    setSelectedAssignments(asg);
    setSelectedTraining(trn);
    if (updatedStudent) {
      setSelectedStudent(updatedStudent);
    }
    await loadRoster();
  };

  // Assessment CRUD
  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || actionLoading) return;
    setActionLoading(true);
    try {
      await addStudentAssessment(selectedStudent.id, assessmentForm);
      await refreshStudentDetails(selectedStudent.id);
      setShowAddAssessment(false);
      setAssessmentForm({
        subjectName: 'Mathematics',
        title: '',
        topicName: 'Geometry',
        date: 'Thursday',
        weight: '20% of Term',
        importance: 'high',
      });
    } catch (err) {
      console.error('Add assessment error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAssessment = async (asmId: string) => {
    if (!selectedStudent) return;
    setActionLoading(true);
    try {
      await deleteStudentAssessment(selectedStudent.id, asmId);
      await refreshStudentDetails(selectedStudent.id);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Delete assessment error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Assignment CRUD
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || actionLoading) return;
    setActionLoading(true);
    try {
      await addStudentAssignment(selectedStudent.id, assignmentForm);
      await refreshStudentDetails(selectedStudent.id);
      setShowAddAssignment(false);
      setAssignmentForm({
        subjectName: 'Science',
        title: '',
        dueDate: 'Friday',
        estimatedMinutes: 45,
        notes: '',
      });
    } catch (err) {
      console.error('Add assignment error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAssignment = async (asgId: string) => {
    if (!selectedStudent) return;
    setActionLoading(true);
    try {
      await deleteStudentAssignment(selectedStudent.id, asgId);
      await refreshStudentDetails(selectedStudent.id);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Delete assignment error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Topic Mastery CRUD
  const handleSaveMastery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || actionLoading) return;
    setActionLoading(true);
    try {
      await updateStudentTopicMastery(selectedStudent.id, masteryForm);
      await refreshStudentDetails(selectedStudent.id);
      setShowUpdateMastery(false);
    } catch (err) {
      console.error('Update mastery error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Training Session CRUD
  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || actionLoading) return;
    setActionLoading(true);
    try {
      await addStudentTrainingSession(selectedStudent.id, trainingForm);
      await refreshStudentDetails(selectedStudent.id);
      setShowAddTraining(false);
      setTrainingForm({
        sport: selectedStudent.sport || 'Track & Field',
        dayOfWeek: 'Monday',
        durationMinutes: 60,
        intensity: 'Moderate',
        notes: '',
      });
    } catch (err) {
      console.error('Add training error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTraining = async (sessionId: string) => {
    if (!selectedStudent) return;
    setActionLoading(true);
    try {
      await deleteStudentTrainingSession(selectedStudent.id, sessionId);
      await refreshStudentDetails(selectedStudent.id);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Delete training error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.grade.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === 'All' || s.attentionStatus === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const attentionCount = students.filter((s) => s.attentionStatus === 'Attention').length;
  const watchCount = students.filter((s) => s.attentionStatus === 'Watch').length;
  const onTrackCount = students.filter((s) => s.attentionStatus === 'On Track').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-[#1E293B]" />
              <h1 className="text-xl font-semibold text-[#1A1A1A]">Coach & Guide Command Center</h1>
            </div>
            <p className="text-xs text-[#525252] mt-1 leading-relaxed">
              See which students may need your attention today and why.
            </p>
          </div>

          {/* Metric Summary Chips */}
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-colors ${
                statusFilter === 'All'
                  ? 'bg-[#1E293B] text-white border-[#1E293B]'
                  : 'bg-white border-[#E2E8F0] text-[#475569]'
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter('Attention')}
              className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-colors flex items-center space-x-1 ${
                statusFilter === 'Attention'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Attention ({attentionCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('Watch')}
              className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-colors ${
                statusFilter === 'Watch'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              Watch ({watchCount})
            </button>
            <button
              onClick={() => setStatusFilter('On Track')}
              className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-colors ${
                statusFilter === 'On Track'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              On Track ({onTrackCount})
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, sport, or grade..."
              className="w-full bg-[#FAF9F6] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B]"
            />
          </div>

          <div className="text-xs text-[#64748B] self-end sm:self-center">
            Showing {filteredStudents.length} of {students.length} student-athletes
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-medium">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Sport & Grade</th>
                <th className="py-3 px-4">Academic</th>
                <th className="py-3 px-4">Training</th>
                <th className="py-3 px-4">Workload</th>
                <th className="py-3 px-4">Status & Signal Reason</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredStudents.map((st) => {
                const isAttention = st.attentionStatus === 'Attention';
                const isWatch = st.attentionStatus === 'Watch';
                return (
                  <tr
                    key={st.id}
                    onClick={() => handleOpenStudentDetail(st)}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                  >
                    {/* Student Name */}
                    <td className="py-3.5 px-4 font-semibold text-[#1A1A1A]">
                      <div className="flex items-center space-x-2">
                        <span>{st.name}</span>
                        {st.id === 'student_maya_patel' && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-mono border border-indigo-200">
                            Primary Demo
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Sport & Grade */}
                    <td className="py-3.5 px-4 text-[#525252]">
                      <div>{st.sport}</div>
                      <div className="text-[11px] text-[#64748B]">{st.grade}</div>
                    </td>

                    {/* Academic Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          st.academicStatus === 'High Risk'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : st.academicStatus === 'Needs Attention'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : st.academicStatus === 'Watchlist'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {st.academicStatus}
                      </span>
                    </td>

                    {/* Training Load */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          st.trainingLoad === 'Extreme'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : st.trainingLoad === 'High'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {st.trainingLoad}
                      </span>
                    </td>

                    {/* Overall Workload */}
                    <td className="py-3.5 px-4 text-[#525252]">
                      <span className="font-medium text-[#1A1A1A]">{st.workloadStatus}</span>
                    </td>

                    {/* Status & Exact Deterministic Reason */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-start space-x-1.5">
                        <span
                          className={`mt-0.5 inline-block shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isAttention
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isWatch
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {st.attentionStatus}
                        </span>
                        <p className="text-[11px] text-[#525252] leading-tight line-clamp-2">
                          {st.attentionReason}
                        </p>
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStudentDetail(st);
                        }}
                        className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-md transition-colors"
                        title="View Detailed Student Profile & Manage Records"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Student Inspection & Management Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-xl border border-[#E2E8F0] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#F1F5F9] flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-[#1A1A1A]">{selectedStudent.name}</h2>
                  <span className="text-xs text-[#64748B] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded">
                    {selectedStudent.sport} • {selectedStudent.grade}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      selectedStudent.attentionStatus === 'Attention'
                        ? 'bg-amber-100 text-amber-900'
                        : selectedStudent.attentionStatus === 'Watch'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {selectedStudent.attentionStatus}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Overall GPA: {selectedStudent.overallGpa} • Academic: {selectedStudent.academicStatus} • Training: {selectedStudent.trainingLoad}
                </p>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 text-[#64748B] hover:text-[#1A1A1A] rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tab Navigation */}
            <div className="px-5 border-b border-[#E2E8F0] bg-white flex space-x-4 overflow-x-auto text-xs">
              {[
                { id: 'overview', label: 'Overview & Attention' },
                { id: 'assessments', label: `Assessments (${selectedAssessments.length})` },
                { id: 'assignments', label: `Assignments (${selectedAssignments.length})` },
                { id: 'mastery', label: `Mastery (${selectedTopics.length})` },
                { id: 'training', label: `Training (${selectedTraining.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as ModalSubTab)}
                  className={`py-3 font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                    activeSubTab === tab.id
                      ? 'border-[#1E293B] text-[#1E293B]'
                      : 'border-transparent text-[#64748B] hover:text-[#1A1A1A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
              {loadingDetail ? (
                <div className="py-12 text-center text-xs text-[#64748B]">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#1E293B] mb-2"></div>
                  <p>Loading student records from Firestore...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW */}
                  {activeSubTab === 'overview' && (
                    <div className="space-y-4">
                      {/* Attention Diagnostic Banner */}
                      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70">
                        <div className="flex items-center space-x-2 text-amber-900 font-semibold mb-1">
                          <AlertTriangle className="w-4 h-4 text-amber-700" />
                          <span>Attention Signal Diagnostic</span>
                        </div>
                        <p className="text-amber-950 leading-relaxed text-xs">
                          {selectedStudent.attentionReason}
                        </p>
                      </div>

                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#FAFAFA]">
                          <span className="text-[11px] text-[#64748B] font-medium">Academic Status</span>
                          <p className="text-sm font-bold text-[#1A1A1A] mt-1">{selectedStudent.academicStatus}</p>
                        </div>
                        <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#FAFAFA]">
                          <span className="text-[11px] text-[#64748B] font-medium">Weekly Training Volume</span>
                          <p className="text-sm font-bold text-[#1A1A1A] mt-1">{selectedStudent.trainingLoad}</p>
                        </div>
                        <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#FAFAFA]">
                          <span className="text-[11px] text-[#64748B] font-medium">Workload Rating</span>
                          <p className="text-sm font-bold text-[#1A1A1A] mt-1">{selectedStudent.workloadStatus}</p>
                        </div>
                      </div>

                      {/* Coach Directive */}
                      <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white">
                        <h3 className="font-semibold text-[#1A1A1A] mb-1">Coach Accommodation Directive</h3>
                        <p className="text-[11px] text-[#64748B] mb-2">
                          Log guidance for study periods or training load modifications.
                        </p>
                        <textarea
                          rows={2}
                          value={coachNote}
                          onChange={(e) => setCoachNote(e.target.value)}
                          placeholder="e.g. Advised lighter track strides on Wednesday to protect Thursday exam readiness..."
                          className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B]"
                        />
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[11px] text-emerald-700">
                            {noteSaved ? '✓ Directive saved' : ''}
                          </span>
                          <button
                            onClick={() => {
                              if (!coachNote.trim()) return;
                              setNoteSaved(true);
                              setTimeout(() => setNoteSaved(false), 3000);
                            }}
                            className="px-3 py-1.5 bg-[#1E293B] text-white rounded-md text-xs font-medium cursor-pointer"
                          >
                            Save Directive
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ASSESSMENTS */}
                  {activeSubTab === 'assessments' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-[#1A1A1A]">Upcoming & Graded Assessments</h3>
                          <p className="text-[11px] text-[#64748B]">Manage tests, quizzes, and exams</p>
                        </div>
                        <button
                          onClick={() => setShowAddAssessment(true)}
                          className="px-3 py-1.5 bg-[#1E293B] text-white rounded-lg text-xs font-medium flex items-center space-x-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Assessment</span>
                        </button>
                      </div>

                      {selectedAssessments.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-[#CBD5E1] rounded-lg text-[#64748B]">
                          No upcoming assessments recorded.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedAssessments.map((asm) => (
                            <div
                              key={asm.id}
                              className="p-3.5 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-between"
                            >
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-[#1A1A1A]">{asm.title}</span>
                                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                    {asm.subjectName}
                                  </span>
                                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded uppercase">
                                    {asm.date}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#64748B] mt-0.5">
                                  Topic: {asm.topicName} • Weight: {asm.weight}
                                  {asm.score != null && ` • Score: ${asm.score}%`}
                                </p>
                              </div>

                              <div className="flex items-center space-x-2">
                                {confirmDeleteId?.id === asm.id ? (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-[10px] text-rose-600 font-medium">Confirm?</span>
                                    <button
                                      onClick={() => handleDeleteAssessment(asm.id)}
                                      className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px]"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteId({ type: 'assessment', id: asm.id })}
                                    className="p-1.5 text-[#94A3B8] hover:text-rose-600 transition-colors"
                                    title="Delete Assessment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: ASSIGNMENTS */}
                  {activeSubTab === 'assignments' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-[#1A1A1A]">Homework & Deliverables</h3>
                          <p className="text-[11px] text-[#64748B]">Manage coursework submissions</p>
                        </div>
                        <button
                          onClick={() => setShowAddAssignment(true)}
                          className="px-3 py-1.5 bg-[#1E293B] text-white rounded-lg text-xs font-medium flex items-center space-x-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Assignment</span>
                        </button>
                      </div>

                      {selectedAssignments.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-[#CBD5E1] rounded-lg text-[#64748B]">
                          No assignments currently recorded.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedAssignments.map((asg) => (
                            <div
                              key={asg.id}
                              className="p-3.5 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-between"
                            >
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-[#1A1A1A]">{asg.title}</span>
                                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                    {asg.subjectName}
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded capitalize ${
                                      asg.status === 'overdue'
                                        ? 'bg-rose-100 text-rose-800'
                                        : asg.status === 'completed'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {asg.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#64748B] mt-0.5">
                                  Due: {asg.dueDate} • Est: {asg.estimatedMinutes}m {asg.notes && `• ${asg.notes}`}
                                </p>
                              </div>

                              <div className="flex items-center space-x-2">
                                {confirmDeleteId?.id === asg.id ? (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-[10px] text-rose-600 font-medium">Confirm?</span>
                                    <button
                                      onClick={() => handleDeleteAssignment(asg.id)}
                                      className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px]"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteId({ type: 'assignment', id: asg.id })}
                                    className="p-1.5 text-[#94A3B8] hover:text-rose-600 transition-colors"
                                    title="Delete Assignment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: MASTERY */}
                  {activeSubTab === 'mastery' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-[#1A1A1A]">Curriculum Mastery Levels</h3>
                        <p className="text-[11px] text-[#64748B]">Click "Update" to modify any topic percentage</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedTopics.map((top) => (
                          <div
                            key={top.id}
                            className={`p-3.5 rounded-lg border flex items-center justify-between ${
                              top.masteryPercentage < 70
                                ? 'border-amber-200 bg-amber-50/50'
                                : 'border-[#E2E8F0] bg-white'
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-[#1A1A1A]">{top.name}</p>
                              <p className="text-[11px] text-[#64748B]">{top.subjectName}</p>
                              <div className="w-32 bg-[#E2E8F0] h-1.5 rounded-full mt-2 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    top.masteryPercentage >= 80
                                      ? 'bg-emerald-600'
                                      : top.masteryPercentage >= 70
                                      ? 'bg-blue-600'
                                      : 'bg-amber-600'
                                  }`}
                                  style={{ width: `${top.masteryPercentage}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded ${
                                  top.masteryPercentage < 70
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-emerald-50 text-emerald-800'
                                }`}
                              >
                                {top.masteryPercentage}%
                              </span>
                              <div className="mt-2">
                                <button
                                  onClick={() => {
                                    setMasteryForm({
                                      topicId: top.id,
                                      subjectName: top.subjectName,
                                      topicName: top.name,
                                      masteryPercentage: top.masteryPercentage,
                                    });
                                    setShowUpdateMastery(true);
                                  }}
                                  className="text-[10px] text-[#1E293B] font-semibold hover:underline flex items-center justify-end"
                                >
                                  <Edit2 className="w-3 h-3 mr-1" />
                                  <span>Edit</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: TRAINING */}
                  {activeSubTab === 'training' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-[#1A1A1A]">Athletic Training Sessions</h3>
                          <p className="text-[11px] text-[#64748B]">Schedule practice, intervals, and recovery</p>
                        </div>
                        <button
                          onClick={() => setShowAddTraining(true)}
                          className="px-3 py-1.5 bg-[#1E293B] text-white rounded-lg text-xs font-medium flex items-center space-x-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Training Session</span>
                        </button>
                      </div>

                      {selectedTraining.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-[#CBD5E1] rounded-lg text-[#64748B]">
                          No training sessions scheduled.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedTraining.map((trn) => (
                            <div
                              key={trn.id}
                              className="p-3.5 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="w-20 font-semibold text-[#1A1A1A]">{trn.dayOfWeek}</span>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                    trn.intensity === 'High'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : trn.intensity === 'Moderate'
                                      ? 'bg-slate-100 text-slate-700'
                                      : 'bg-emerald-50 text-emerald-700'
                                  }`}
                                >
                                  {trn.intensity} ({trn.durationMinutes}m)
                                </span>
                                <span className="text-[11px] text-[#525252]">{trn.notes}</span>
                              </div>

                              <div className="flex items-center space-x-2">
                                {confirmDeleteId?.id === trn.id ? (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-[10px] text-rose-600 font-medium">Confirm?</span>
                                    <button
                                      onClick={() => handleDeleteTraining(trn.id)}
                                      className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px]"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteId({ type: 'training', id: trn.id })}
                                    className="p-1.5 text-[#94A3B8] hover:text-rose-600 transition-colors"
                                    title="Delete Training Session"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD ASSESSMENT */}
      {showAddAssessment && selectedStudent && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
              <h3 className="font-semibold text-[#1A1A1A]">Add Assessment: {selectedStudent.name}</h3>
              <button onClick={() => setShowAddAssessment(false)} className="text-[#64748B] hover:text-[#1A1A1A]">✕</button>
            </div>
            <form onSubmit={handleSaveAssessment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#475569] font-medium mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={assessmentForm.subjectName}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, subjectName: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2 text-[#1A1A1A]"
                />
              </div>
              <div>
                <label className="block text-[#475569] font-medium mb-1">Assessment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Geometry Unit 4 Exam"
                  value={assessmentForm.title}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2 text-[#1A1A1A]"
                />
              </div>
              <div>
                <label className="block text-[#475569] font-medium mb-1">Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Geometry"
                  value={assessmentForm.topicName}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, topicName: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2 text-[#1A1A1A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Day / Date</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thursday"
                    value={assessmentForm.date}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, date: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Weight</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20% of Term"
                    value={assessmentForm.weight}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, weight: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setShowAddAssessment(false)}
                  className="px-3 py-1.5 bg-slate-100 text-[#475569] rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-[#1E293B] text-white rounded-md font-medium"
                >
                  {actionLoading ? 'Saving...' : 'Save Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD ASSIGNMENT */}
      {showAddAssignment && selectedStudent && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
              <h3 className="font-semibold text-[#1A1A1A]">Add Assignment: {selectedStudent.name}</h3>
              <button onClick={() => setShowAddAssignment(false)} className="text-[#64748B] hover:text-[#1A1A1A]">✕</button>
            </div>
            <form onSubmit={handleSaveAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#475569] font-medium mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={assignmentForm.subjectName}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, subjectName: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2 text-[#1A1A1A]"
                />
              </div>
              <div>
                <label className="block text-[#475569] font-medium mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Circuit Analysis Problem Set"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2 text-[#1A1A1A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Due Date</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Friday"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Est. Minutes</label>
                  <input
                    type="number"
                    required
                    value={assignmentForm.estimatedMinutes}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, estimatedMinutes: Number(e.target.value) })}
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setShowAddAssignment(false)}
                  className="px-3 py-1.5 bg-slate-100 text-[#475569] rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-[#1E293B] text-white rounded-md font-medium"
                >
                  {actionLoading ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: UPDATE TOPIC MASTERY */}
      {showUpdateMastery && selectedStudent && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
              <h3 className="font-semibold text-[#1A1A1A]">Update Mastery: {masteryForm.topicName}</h3>
              <button onClick={() => setShowUpdateMastery(false)} className="text-[#64748B] hover:text-[#1A1A1A]">✕</button>
            </div>
            <form onSubmit={handleSaveMastery} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#475569] font-medium mb-1">
                  Mastery Percentage (Current: {masteryForm.masteryPercentage}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masteryForm.masteryPercentage}
                  onChange={(e) => setMasteryForm({ ...masteryForm, masteryPercentage: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="mt-1 flex items-center justify-between">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={masteryForm.masteryPercentage}
                    onChange={(e) => setMasteryForm({ ...masteryForm, masteryPercentage: Number(e.target.value) })}
                    className="w-20 bg-[#FAF9F6] border border-[#CBD5E1] rounded p-1.5 text-center font-bold text-xs"
                  />
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      masteryForm.masteryPercentage >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : masteryForm.masteryPercentage >= 70
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {masteryForm.masteryPercentage >= 80
                      ? 'Strong'
                      : masteryForm.masteryPercentage >= 70
                      ? 'Proficient'
                      : 'Needs Attention'}
                  </span>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setShowUpdateMastery(false)}
                  className="px-3 py-1.5 bg-slate-100 text-[#475569] rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-[#1E293B] text-white rounded-md font-medium"
                >
                  {actionLoading ? 'Saving...' : 'Update Mastery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD TRAINING SESSION */}
      {showAddTraining && selectedStudent && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
              <h3 className="font-semibold text-[#1A1A1A]">Add Training: {selectedStudent.name}</h3>
              <button onClick={() => setShowAddTraining(false)} className="text-[#64748B] hover:text-[#1A1A1A]">✕</button>
            </div>
            <form onSubmit={handleSaveTraining} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Day of Week</label>
                  <select
                    value={trainingForm.dayOfWeek}
                    onChange={(e) => setTrainingForm({ ...trainingForm, dayOfWeek: e.target.value as any })}
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2 text-[#1A1A1A]"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Intensity</label>
                  <select
                    value={trainingForm.intensity}
                    onChange={(e) => setTrainingForm({ ...trainingForm, intensity: e.target.value as IntensityLevel })}
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2 text-[#1A1A1A]"
                  >
                    <option value="Light">Light</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Sport</label>
                  <input
                    type="text"
                    required
                    value={trainingForm.sport}
                    onChange={(e) => setTrainingForm({ ...trainingForm, sport: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-medium mb-1">Duration (min)</label>
                  <input
                    type="number"
                    required
                    value={trainingForm.durationMinutes}
                    onChange={(e) => setTrainingForm({ ...trainingForm, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2 text-[#1A1A1A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#475569] font-medium mb-1">Session Notes</label>
                <input
                  type="text"
                  placeholder="e.g. 800m ladder pace intervals"
                  value={trainingForm.notes || ''}
                  onChange={(e) => setTrainingForm({ ...trainingForm, notes: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg p-2 text-[#1A1A1A]"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setShowAddTraining(false)}
                  className="px-3 py-1.5 bg-slate-100 text-[#475569] rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-[#1E293B] text-white rounded-md font-medium"
                >
                  {actionLoading ? 'Saving...' : 'Save Training'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
