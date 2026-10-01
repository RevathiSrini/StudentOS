import React, { useState } from 'react';
import { UserRole, UserProfile, SchoolIdentityType, ActivationVerificationRequest } from '../types';
import {
  signInUser,
  activateUserAccount,
  resetUserPassword,
  signInDemoUser,
} from '../lib/authService';
import {
  ShieldCheck,
  ArrowRight,
  User,
  HeartHandshake,
  Compass,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  ChevronLeft,
  KeyRound,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';

interface LoginPageProps {
  onAuthenticated: (profile: UserProfile) => void;
}

type AuthView = 'signin' | 'activation_select' | 'activation_form' | 'forgot_password';

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthenticated }) => {
  const [view, setView] = useState<AuthView>('signin');
  const [selectedIdentityType, setSelectedIdentityType] = useState<SchoolIdentityType>('student');

  // Sign in fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Activation common fields
  const [fullName, setFullName] = useState('');
  const [activationEmail, setActivationEmail] = useState('');
  const [activationPassword, setActivationPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Student specific
  const [studentId, setStudentId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Parent specific
  const [childStudentId, setChildStudentId] = useState('');

  // Coach specific
  const [staffId, setStaffId] = useState('');
  const [accessCode, setAccessCode] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<UserRole | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [showRegistrySamples, setShowRegistrySamples] = useState(false);

  // Handle Standard Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      const profile = await signInUser(signInEmail.trim(), signInPassword);
      onAuthenticated(profile);
    } catch (err: any) {
      console.error('Sign in error:', err);
      let msg = err.message || 'Authentication failed. Please verify credentials.';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password.';
      } else if (msg.includes('auth/user-not-found')) {
        msg = 'No activated account found with this email. Please activate your account first.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      await resetUserPassword(signInEmail.trim());
      setInfoMsg('Password reset instructions sent to your email address.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Account Activation Submission
  const handleActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (activationPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (activationPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const req: ActivationVerificationRequest = {
      identityType: selectedIdentityType,
      fullName: fullName.trim(),
      email: activationEmail.trim(),
      password: activationPassword,
      studentId: studentId.trim(),
      dateOfBirth: dateOfBirth.trim(),
      childStudentId: childStudentId.trim(),
      staffId: staffId.trim(),
      accessCode: accessCode.trim(),
    };

    try {
      const profile = await activateUserAccount(req);
      setInfoMsg(`Identity confirmed. Welcome to StudentOS, ${profile.displayName}!`);
      setTimeout(() => {
        onAuthenticated(profile);
      }, 400);
    } catch (err: any) {
      console.error('Activation failure:', err);
      setErrorMsg(err.message || 'Verification failed. Please verify your school identity records.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Instant Demo Entry
  const handleDemoSignIn = async (role: UserRole) => {
    setErrorMsg(null);
    setInfoMsg(null);
    setDemoLoading(role);
    try {
      const profile = await signInDemoUser(role);
      onAuthenticated(profile);
    } catch (err: any) {
      console.error('Demo auth failed:', err);
      setErrorMsg('Failed to initialize demo session. Please try again.');
    } finally {
      setDemoLoading(null);
    }
  };

  // Quick autofill helper for evaluators/testers
  const autofillSample = (type: 'student_pending' | 'student_activated' | 'parent_pending' | 'parent_activated' | 'coach_pending' | 'coach_activated') => {
    setErrorMsg(null);
    setInfoMsg(null);
    if (type === 'student_pending') {
      setSelectedIdentityType('student');
      setView('activation_form');
      setFullName('Liam Chen');
      setStudentId('STU-2026-002');
      setDateOfBirth('2008-06-21');
      setActivationEmail('liam.chen@studentos.internal');
      setActivationPassword('Student2026!');
      setConfirmPassword('Student2026!');
    } else if (type === 'student_activated') {
      setSelectedIdentityType('student');
      setView('activation_form');
      setFullName('Maya Patel');
      setStudentId('STU-2026-001');
      setDateOfBirth('2008-04-12');
      setActivationEmail('maya.patel@studentos.internal');
      setActivationPassword('Student2026!');
      setConfirmPassword('Student2026!');
    } else if (type === 'parent_pending') {
      setSelectedIdentityType('parent');
      setView('activation_form');
      setFullName('David Chen');
      setChildStudentId('STU-2026-002');
      setActivationEmail('david.chen@family.internal');
      setActivationPassword('Parent2026!');
      setConfirmPassword('Parent2026!');
    } else if (type === 'parent_activated') {
      setSelectedIdentityType('parent');
      setView('activation_form');
      setFullName('Priya Patel');
      setChildStudentId('STU-2026-001');
      setActivationEmail('priya.patel@family.internal');
      setActivationPassword('Parent2026!');
      setConfirmPassword('Parent2026!');
    } else if (type === 'coach_pending') {
      setSelectedIdentityType('coach');
      setView('activation_form');
      setFullName('Sarah Miller');
      setStaffId('STAFF-ATH-02');
      setAccessCode('ATH-COACH-88');
      setActivationEmail('sarah.miller@athletics.internal');
      setActivationPassword('Coach2026!');
      setConfirmPassword('Coach2026!');
    } else if (type === 'coach_activated') {
      setSelectedIdentityType('coach');
      setView('activation_form');
      setFullName('Marcus Reed');
      setStaffId('STAFF-ATH-01');
      setAccessCode('ATH-COACH-77');
      setActivationEmail('marcus.reed@athletics.internal');
      setActivationPassword('Coach2026!');
      setConfirmPassword('Coach2026!');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#FAF9F6]">
      <div className="max-w-md w-full">
        {/* Brand & Subtitle */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#1E293B] text-white font-bold text-xl mb-3 shadow-xs">
            S
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1A1A1A]">
            StudentOS
          </h1>
          <p className="mt-1 text-sm text-[#525252]">
            Academic and athletic success, in one place.
          </p>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: SIGN IN PAGE */}
        {/* ======================================================== */}
        {view === 'signin' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 sm:p-7 shadow-2xs mb-6">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9] mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#1A1A1A]">Sign In</h2>
                <p className="text-[11px] text-[#64748B]">Access your authorized dashboard</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setInfoMsg(null);
                  setView('activation_select');
                }}
                className="text-xs font-semibold text-[#1E293B] hover:underline cursor-pointer flex items-center space-x-1"
              >
                <span>Activate Account</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {infoMsg && (
              <div className="mb-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{infoMsg}</span>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="name@school.org"
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg pl-8.5 pr-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[#475569]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setInfoMsg(null);
                      setView('forgot_password');
                    }}
                    className="text-[11px] text-[#64748B] hover:text-[#1E293B] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg pl-8.5 pr-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setInfoMsg(null);
                    setView('activation_select');
                  }}
                  className="text-xs text-[#475569] hover:text-[#1E293B] font-medium"
                >
                  First time here? <span className="underline font-semibold">Activate Account</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: ACTIVATION ROLE SELECTION */}
        {/* ======================================================== */}
        {view === 'activation_select' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 sm:p-7 shadow-2xs mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setView('signin');
                }}
                className="text-xs font-medium text-[#64748B] hover:text-[#1E293B] flex items-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
              <span className="text-[11px] font-mono text-[#94A3B8]">Step 1 of 2</span>
            </div>

            <div className="mb-5">
              <h2 className="text-base font-semibold text-[#1A1A1A]">
                Activate your StudentOS account
              </h2>
              <p className="mt-1 text-xs text-[#525252]">
                Choose how you are registered with your school.
              </p>
            </div>

            <div className="space-y-3 mb-5">
              {/* Option 1: Student */}
              <button
                type="button"
                onClick={() => {
                  setSelectedIdentityType('student');
                  setErrorMsg(null);
                  setView('activation_form');
                }}
                className="w-full p-3.5 rounded-lg border border-[#E2E8F0] hover:border-[#1E293B] hover:bg-[#F8FAFC] text-left transition-all group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] text-[#1E293B] group-hover:bg-[#1E293B] group-hover:text-white flex items-center justify-center transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#1A1A1A]">Student</div>
                    <div className="text-[11px] text-[#64748B]">
                      Enrolled student-athlete in the school directory
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#1E293B] transition-colors" />
              </button>

              {/* Option 2: Parent / Guardian */}
              <button
                type="button"
                onClick={() => {
                  setSelectedIdentityType('parent');
                  setErrorMsg(null);
                  setView('activation_form');
                }}
                className="w-full p-3.5 rounded-lg border border-[#E2E8F0] hover:border-[#1E293B] hover:bg-[#F8FAFC] text-left transition-all group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] text-[#1E293B] group-hover:bg-[#1E293B] group-hover:text-white flex items-center justify-center transition-colors">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#1A1A1A]">Parent / Guardian</div>
                    <div className="text-[11px] text-[#64748B]">
                      Parent or legal guardian linked to an enrolled student
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#1E293B] transition-colors" />
              </button>

              {/* Option 3: Coach / Guide */}
              <button
                type="button"
                onClick={() => {
                  setSelectedIdentityType('coach');
                  setErrorMsg(null);
                  setView('activation_form');
                }}
                className="w-full p-3.5 rounded-lg border border-[#E2E8F0] hover:border-[#1E293B] hover:bg-[#F8FAFC] text-left transition-all group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] text-[#1E293B] group-hover:bg-[#1E293B] group-hover:text-white flex items-center justify-center transition-colors">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#1A1A1A]">Coach / Guide</div>
                    <div className="text-[11px] text-[#64748B]">
                      Athletic coach, performance trainer, or guide staff
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#1E293B] transition-colors" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-start space-x-2 text-[11px] text-[#64748B]">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#1E293B]" />
              <p>
                <strong>Security Architecture:</strong> Selecting an option determines the identity verification form displayed. Your actual permissions and role are determined by the verified school registry.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: ACTIVATION VERIFICATION FORM */}
        {/* ======================================================== */}
        {view === 'activation_form' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 sm:p-7 shadow-2xs mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setView('activation_select');
                }}
                className="text-xs font-medium text-[#64748B] hover:text-[#1E293B] flex items-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Choose different role</span>
              </button>
              <span className="text-[11px] font-mono text-[#94A3B8]">Step 2 of 2</span>
            </div>

            <div className="mb-4">
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#F1F5F9] text-[#1E293B] text-[10px] font-semibold uppercase tracking-wider mb-1">
                <span>Verification Form: {selectedIdentityType === 'student' ? 'Student' : selectedIdentityType === 'parent' ? 'Parent / Guardian' : 'Coach / Guide'}</span>
              </div>
              <h2 className="text-base font-semibold text-[#1A1A1A]">
                Verify Pre-Enrolled School Identity
              </h2>
              <p className="mt-0.5 text-xs text-[#525252]">
                Supply your pre-enrolled records to authorize your StudentOS access.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {infoMsg && (
              <div className="mb-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{infoMsg}</span>
              </div>
            )}

            <form onSubmit={handleActivationSubmit} className="space-y-3.5">
              {/* Full Legal Name */}
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">
                  Full Name (as registered with school)
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={
                    selectedIdentityType === 'student'
                      ? 'e.g. Liam Chen'
                      : selectedIdentityType === 'parent'
                      ? 'e.g. David Chen'
                      : 'e.g. Sarah Miller'
                  }
                  className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B]"
                />
              </div>

              {/* STUDENT FIELDS */}
              {selectedIdentityType === 'student' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-[#475569] mb-1">
                      Student ID Number
                    </label>
                    <input
                      type="text"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="STU-2026-002"
                      className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#475569] mb-1">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                      <input
                        type="date"
                        required
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg pl-8.5 pr-2 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PARENT FIELDS */}
              {selectedIdentityType === 'parent' && (
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1">
                    Student ID of Enrolled Child
                  </label>
                  <input
                    type="text"
                    required
                    value={childStudentId}
                    onChange={(e) => setChildStudentId(e.target.value)}
                    placeholder="e.g. STU-2026-002 or STU-2026-001"
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B] font-mono"
                  />
                  <p className="text-[10px] text-[#64748B] mt-1">
                    Verifies parental guardianship linkage in student roster
                  </p>
                </div>
              )}

              {/* COACH FIELDS */}
              {selectedIdentityType === 'coach' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-[#475569] mb-1">
                      Staff / Employee ID
                    </label>
                    <input
                      type="text"
                      required
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      placeholder="STAFF-ATH-02"
                      className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#475569] mb-1">
                      Staff Access Code
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        placeholder="ATH-COACH-88"
                        className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg pl-8.5 pr-2 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B] font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Login Email */}
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">
                  Email for StudentOS Login
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={activationEmail}
                    onChange={(e) => setActivationEmail(e.target.value)}
                    placeholder="official.email@school.org"
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg pl-8.5 pr-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B]"
                  />
                </div>
              </div>

              {/* Password setup */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1">
                    Create Password
                  </label>
                  <input
                    type="password"
                    required
                    value={activationPassword}
                    onChange={(e) => setActivationPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-2.5 px-4 rounded-lg bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{loading ? 'Verifying Registry & Activating...' : 'Verify & Activate Account'}</span>
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: FORGOT PASSWORD */}
        {/* ======================================================== */}
        {view === 'forgot_password' && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 sm:p-7 shadow-2xs mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Reset Password</h2>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setInfoMsg(null);
                  setView('signin');
                }}
                className="text-xs font-medium text-[#1E293B] hover:underline cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {infoMsg && (
              <div className="mb-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{infoMsg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">
                  Enter your registered account email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="name@school.org"
                    className="w-full bg-[#FAF9F6] border border-[#CBD5E1] rounded-lg pl-8.5 pr-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1E293B]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* COLLAPSIBLE REGISTRY TEST SAMPLES DRAWER (FOR EVALUATORS) */}
        {/* ======================================================== */}
        <div className="mb-6 bg-white border border-[#E2E8F0] rounded-xl p-4">
          <button
            type="button"
            onClick={() => setShowRegistrySamples(!showRegistrySamples)}
            className="w-full flex items-center justify-between text-xs font-medium text-[#475569] hover:text-[#1E293B] cursor-pointer"
          >
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold text-[#1A1A1A]">Pre-Enrolled School Registry Test Records</span>
            </div>
            <span className="text-[11px] underline text-[#64748B]">
              {showRegistrySamples ? 'Hide Samples' : 'Show Samples & 1-Click Autofill'}
            </span>
          </button>

          {showRegistrySamples && (
            <div className="mt-3 pt-3 border-t border-[#F1F5F9] space-y-2.5 text-[11px]">
              <p className="text-[11px] text-[#64748B]">
                Test the account activation architecture with these synthetic school records:
              </p>

              {/* Student Pending Activation */}
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#1A1A1A] flex items-center space-x-1.5">
                    <span>Liam Chen (Student)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      Pending Activation
                    </span>
                  </div>
                  <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                    ID: STU-2026-002 • DOB: 2008-06-21 • Swim
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => autofillSample('student_pending')}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-[#1E293B] hover:text-white border border-[#CBD5E1] rounded text-[#1E293B] transition-colors cursor-pointer"
                >
                  Autofill & Test
                </button>
              </div>

              {/* Student Already Activated */}
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#1A1A1A] flex items-center space-x-1.5">
                    <span>Maya Patel (Student)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Already Activated
                    </span>
                  </div>
                  <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                    ID: STU-2026-001 (Tests duplicate prevention)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => autofillSample('student_activated')}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-[#1E293B] hover:text-white border border-[#CBD5E1] rounded text-[#1E293B] transition-colors cursor-pointer"
                >
                  Test Duplicate
                </button>
              </div>

              {/* Parent Pending Activation */}
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#1A1A1A] flex items-center space-x-1.5">
                    <span>David Chen (Parent)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      Pending Activation
                    </span>
                  </div>
                  <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                    Child: STU-2026-002 (Liam Chen)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => autofillSample('parent_pending')}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-[#1E293B] hover:text-white border border-[#CBD5E1] rounded text-[#1E293B] transition-colors cursor-pointer"
                >
                  Autofill & Test
                </button>
              </div>

              {/* Coach Pending Activation */}
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#1A1A1A] flex items-center space-x-1.5">
                    <span>Coach Sarah Miller (Coach)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      Pending Activation
                    </span>
                  </div>
                  <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                    Staff: STAFF-ATH-02 • Code: ATH-COACH-88
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => autofillSample('coach_pending')}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-[#1E293B] hover:text-white border border-[#CBD5E1] rounded text-[#1E293B] transition-colors cursor-pointer"
                >
                  Autofill & Test
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* EXPLORE THE DEMO SECTION */}
        {/* ======================================================== */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-2xs">
          <div className="text-center mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
              Explore the demo
            </h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Experience StudentOS instantly without creating an account.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Try as Student */}
            <button
              type="button"
              onClick={() => handleDemoSignIn('student')}
              disabled={demoLoading !== null}
              className="p-3 rounded-lg border border-[#E2E8F0] hover:border-[#1E293B] hover:bg-[#F8FAFC] text-left transition-all group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#1A1A1A]">
                <User className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#1E293B]" />
                <span>Try as Student</span>
              </div>
              <p className="text-[10px] text-[#64748B] mt-1 font-mono">Maya Patel (Gr 11)</p>
            </button>

            {/* Try as Parent */}
            <button
              type="button"
              onClick={() => handleDemoSignIn('parent')}
              disabled={demoLoading !== null}
              className="p-3 rounded-lg border border-[#E2E8F0] hover:border-[#1E293B] hover:bg-[#F8FAFC] text-left transition-all group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#1A1A1A]">
                <HeartHandshake className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#1E293B]" />
                <span>Try as Parent</span>
              </div>
              <p className="text-[10px] text-[#64748B] mt-1 font-mono">Priya Patel</p>
            </button>

            {/* Try as Coach */}
            <button
              type="button"
              onClick={() => handleDemoSignIn('coach')}
              disabled={demoLoading !== null}
              className="p-3 rounded-lg border border-[#E2E8F0] hover:border-[#1E293B] hover:bg-[#F8FAFC] text-left transition-all group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#1A1A1A]">
                <Compass className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#1E293B]" />
                <span>Try as Coach</span>
              </div>
              <p className="text-[10px] text-[#64748B] mt-1 font-mono">Coach Marcus Reed</p>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-center space-x-1.5 text-[11px] text-[#737373]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Demo Mode — synthetic student-athlete records.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
