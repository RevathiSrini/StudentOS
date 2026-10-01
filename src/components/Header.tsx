import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import {
  GraduationCap,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { seedInitialFirestoreData } from '../lib/studentService';

interface HeaderProps {
  currentUser: UserProfile;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onOpenEvaluations: () => void;
  onResetData?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  onSelectRole,
  onOpenEvaluations,
  onResetData,
  onSignOut,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await seedInitialFirestoreData();
      if (onResetData) onResetData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6] border-b border-[#E5E7EB] backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#1E293B] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg text-[#1A1A1A] tracking-tight">
                  StudentOS
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#E2E8F0] text-[#475569]">
                  Academic + Athletic
                </span>
              </div>
              <p className="text-xs text-[#64748B] hidden md:block">
                AI-Powered Student Success Platform
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Demo Mode badge */}
            <span className="hidden lg:inline-flex items-center text-xs text-[#64748B] bg-white border border-[#E2E8F0] px-2.5 py-1 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#64748B]" />
              Demo Mode
            </span>

            {/* AI Evaluations Button */}
            <button
              onClick={onOpenEvaluations}
              className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-md bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-colors shadow-2xs cursor-pointer"
              title="Open AI Evaluation Suite (16 Test Cases)"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#475569]" />
              <span className="hidden sm:inline">AI Evaluations</span>
              <span className="sm:hidden">Evals</span>
              <span className="ml-1.5 px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded text-[10px] font-semibold border border-[#E2E8F0]">
                16
              </span>
            </button>

            {/* Reset Data Button */}
            <button
              onClick={handleReset}
              disabled={resetting}
              className="inline-flex items-center text-xs font-medium px-2.5 py-1.5 rounded-md bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              title="Reset synthetic demo data in Cloud Firestore"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline ml-1.5">
                {resetSuccess ? 'Reset Done' : resetting ? 'Resetting...' : 'Reset Data'}
              </span>
            </button>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-[#1E293B] text-white text-xs font-medium hover:bg-[#0F172A] transition-colors shadow-2xs cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5 text-slate-300" />
                <span className="capitalize">{currentRole}</span>
                <ChevronDown className="w-3 h-3 text-slate-300" />
              </button>

              {roleDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50 border border-[#E2E8F0]"
                  onMouseLeave={() => setRoleDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-[#F1F5F9]">
                    <p className="text-[11px] font-medium text-[#64748B]">Switch Demo Role</p>
                    <p className="text-xs font-semibold text-[#1A1A1A] truncate">
                      {currentUser.displayName}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onSelectRole('student');
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F8FAFC] cursor-pointer ${
                      currentRole === 'student' ? 'font-semibold text-[#1E293B] bg-[#F1F5F9]' : 'text-[#475569]'
                    }`}
                  >
                    <div>
                      <p className="font-medium">Student (Maya Patel)</p>
                      <p className="text-[11px] text-[#64748B]">Academics, Training & Balance Agent</p>
                    </div>
                    {currentRole === 'student' && <CheckCircle2 className="w-3.5 h-3.5 text-[#1E293B]" />}
                  </button>
                  <button
                    onClick={() => {
                      onSelectRole('parent');
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F8FAFC] cursor-pointer ${
                      currentRole === 'parent' ? 'font-semibold text-[#1E293B] bg-[#F1F5F9]' : 'text-[#475569]'
                    }`}
                  >
                    <div>
                      <p className="font-medium">Parent (Priya Patel)</p>
                      <p className="text-[11px] text-[#64748B]">Child progress & Parent Copilot</p>
                    </div>
                    {currentRole === 'parent' && <CheckCircle2 className="w-3.5 h-3.5 text-[#1E293B]" />}
                  </button>
                  <button
                    onClick={() => {
                      onSelectRole('coach');
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F8FAFC] cursor-pointer ${
                      currentRole === 'coach' ? 'font-semibold text-[#1E293B] bg-[#F1F5F9]' : 'text-[#475569]'
                    }`}
                  >
                    <div>
                      <p className="font-medium">Coach (Coach Marcus Reed)</p>
                      <p className="text-[11px] text-[#64748B]">Athlete roster & Attention signals</p>
                    </div>
                    {currentRole === 'coach' && <CheckCircle2 className="w-3.5 h-3.5 text-[#1E293B]" />}
                  </button>

                  {onSignOut && (
                    <div className="border-t border-[#F1F5F9] mt-1 pt-1">
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          onSignOut();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center space-x-1.5 cursor-pointer font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Direct Sign Out icon button */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
                title="Sign Out of StudentOS"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
