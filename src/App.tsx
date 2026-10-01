import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, Student } from './types';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { StudentDashboard } from './components/StudentDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { CoachDashboard } from './components/CoachDashboard';
import { AIEvaluationsModal } from './components/AIEvaluationsModal';
import { SEED_USERS, SEED_STUDENTS } from './data/seedData';
import { testConnection } from './lib/firebase';
import { seedInitialFirestoreData, getStudentById } from './lib/studentService';
import { seedSchoolRegistry } from './lib/registryService';
import { subscribeToAuth, getUserProfile, signOutUser, signInDemoUser } from './lib/authService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student>(SEED_STUDENTS[0]);
  const [evalsOpen, setEvalsOpen] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Validate connection to Cloud Firestore upon booting as required by Firebase skill
    async function boot() {
      try {
        await testConnection();
        // Seed initial data in Firestore if needed
        seedInitialFirestoreData().catch(console.warn);
        seedSchoolRegistry().catch(console.warn);
      } catch (err) {
        console.warn('Boot initialization notice:', err);
      } finally {
        setAppReady(true);
      }
    }
    boot();

    // Listen to persistent Firebase Auth state
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          setCurrentUser(profile);
          const studentId = profile.linkedStudentIds?.[0] || 'student_maya_patel';
          const stu = (await getStudentById(studentId)) || SEED_STUDENTS[0];
          setCurrentStudent(stu);
        }
      } else {
        // If unauthenticated, keep currentUser null so LoginPage renders
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuthenticated = async (profile: UserProfile) => {
    setCurrentUser(profile);
    const studentId = profile.linkedStudentIds?.[0] || 'student_maya_patel';
    const s = (await getStudentById(studentId)) || SEED_STUDENTS[0];
    setCurrentStudent(s);
  };

  const handleSelectRole = async (role: UserRole) => {
    try {
      const updatedProfile = await signInDemoUser(role);
      setCurrentUser(updatedProfile);
      const studentId = updatedProfile.linkedStudentIds?.[0] || 'student_maya_patel';
      const s = (await getStudentById(studentId)) || SEED_STUDENTS[0];
      setCurrentStudent(s);
    } catch (err) {
      console.error('Role switch error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setCurrentUser(null);
    }
  };

  if (!appReady) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E293B] mb-3"></div>
          <p className="text-xs text-[#64748B]">Connecting to StudentOS Cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans flex flex-col antialiased selection:bg-slate-200">
      {/* App Header (shown with user details when authenticated) */}
      {currentUser && (
        <Header
          currentUser={currentUser}
          currentRole={currentUser.role}
          onSelectRole={handleSelectRole}
          onOpenEvaluations={() => setEvalsOpen(true)}
          onResetData={() => {
            handleSelectRole(currentUser.role);
          }}
          onSignOut={handleSignOut}
        />
      )}

      {/* Main Content Area: Login Page if unauthenticated, else role-based dashboard */}
      <main className="flex-1">
        {!currentUser ? (
          <LoginPage onAuthenticated={handleAuthenticated} />
        ) : currentUser.role === 'student' ? (
          <StudentDashboard
            student={currentStudent}
            onOpenEvaluations={() => setEvalsOpen(true)}
          />
        ) : currentUser.role === 'parent' ? (
          <ParentDashboard currentUser={currentUser} />
        ) : (
          <CoachDashboard />
        )}
      </main>

      {/* AI Evaluations Modal */}
      <AIEvaluationsModal
        isOpen={evalsOpen}
        onClose={() => setEvalsOpen(false)}
      />

      {/* Subtle Platform Footer */}
      <footer className="py-4 border-t border-[#E5E7EB] bg-[#FAF9F6] text-center text-xs text-[#737373]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#1A1A1A]">StudentOS</span>
            <span>—</span>
            <span>Academic and athletic success, in one place.</span>
          </div>
          <div className="flex items-center space-x-3 text-[#64748B]">
            {currentUser && (
              <>
                <button
                  onClick={handleSignOut}
                  className="hover:underline text-[#334155] cursor-pointer"
                >
                  Sign Out
                </button>
                <span>•</span>
              </>
            )}
            <button
              onClick={() => setEvalsOpen(true)}
              className="hover:underline text-[#334155] cursor-pointer"
            >
              AI Reliability Suite (16 Cases)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
