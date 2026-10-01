import React from 'react';
import { UserRole } from '../types';
import { User, HeartHandshake, Compass, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

interface RoleSelectLandingProps {
  onSelectRole: (role: UserRole) => void;
}

export const RoleSelectLanding: React.FC<RoleSelectLandingProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#FAF9F6]">
      <div className="max-w-3xl w-full">
        {/* Hero Headline */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1E293B] text-white font-bold text-2xl mb-4 shadow-sm">
            S
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1A1A1A]">
            StudentOS
          </h1>
          <p className="mt-2 text-base sm:text-lg text-[#525252] max-w-xl mx-auto leading-relaxed">
            An AI-powered student success platform for schools balancing academics and athletic training.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* 1. Student Card */}
          <div className="bg-white border border-[#E5E7EB] hover:border-[#1E293B] rounded-xl p-5 sm:p-6 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] text-[#1E293B] flex items-center justify-center mb-4">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-[#1A1A1A]">Student</h2>
              <p className="text-xs text-[#64748B] mt-1 font-mono">Maya Patel (Grade 11)</p>
              <p className="text-xs text-[#525252] mt-3 leading-relaxed">
                Track & field athlete balancing a Thursday Geometry assessment with high-intensity Tuesday/Wednesday training.
              </p>
            </div>
            <button
              onClick={() => onSelectRole('student')}
              className="mt-6 w-full py-2.5 px-4 rounded-lg bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <span>Continue as Student</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. Parent Card */}
          <div className="bg-white border border-[#E5E7EB] hover:border-[#1E293B] rounded-xl p-5 sm:p-6 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] text-[#334155] flex items-center justify-center mb-4">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-[#1A1A1A]">Parent</h2>
              <p className="text-xs text-[#64748B] mt-1 font-mono">Priya Patel (Parent)</p>
              <p className="text-xs text-[#525252] mt-3 leading-relaxed">
                Clear visibility into child mastery strengths, upcoming workload crunches, and an AI Parent Copilot.
              </p>
            </div>
            <button
              onClick={() => onSelectRole('parent')}
              className="mt-6 w-full py-2.5 px-4 rounded-lg bg-[#334155] hover:bg-[#1E293B] text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <span>Continue as Parent</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3. Coach Card */}
          <div className="bg-white border border-[#E5E7EB] hover:border-[#1E293B] rounded-xl p-5 sm:p-6 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] text-[#1E293B] flex items-center justify-center mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-[#1A1A1A]">Coach / Guide</h2>
              <p className="text-xs text-[#64748B] mt-1 font-mono">Coach Marcus Reed</p>
              <p className="text-xs text-[#525252] mt-3 leading-relaxed">
                Identifies who needs attention today with clear deterministic signals, training load ratios, and academic warnings.
              </p>
            </div>
            <button
              onClick={() => onSelectRole('coach')}
              className="mt-6 w-full py-2.5 px-4 rounded-lg bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <span>Continue as Coach</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#737373] border-t border-[#E5E7EB] pt-4 px-1 gap-2">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#64748B]" />
            <span>Demo environment — all student records are synthetic.</span>
          </div>
          <div className="flex items-center space-x-2 text-[#525252]">
            <span>Cloud Firestore backed</span>
            <span>•</span>
            <span>Gemini AI Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
