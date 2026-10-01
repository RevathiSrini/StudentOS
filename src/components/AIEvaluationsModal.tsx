import React, { useState } from 'react';
import { EVALUATION_CASES } from '../lib/evaluationSuite';
import { EvalCase } from '../types';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Filter,
  X,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface AIEvaluationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestResult {
  passed: boolean;
  reason: string;
  durationMs: number;
  outputSummary?: string;
}

export const AIEvaluationsModal: React.FC<AIEvaluationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [running, setRunning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedCase, setSelectedCase] = useState<EvalCase | null>(null);

  if (!isOpen) return null;

  const categories = [
    'All',
    'Correct Factual Answers',
    'Hallucination Resistance',
    'Authorization / Privacy',
    'Structured Output Validity',
    'Correct Student Context',
    'Correct Agent Action',
    'Correct Weekly-Plan Reasoning',
  ];

  const filteredCases = EVALUATION_CASES.filter((c) => {
    return activeCategory === 'All' || c.category === activeCategory;
  });

  const runSingleTest = async (testCase: EvalCase): Promise<TestResult> => {
    const startTime = performance.now();

    try {
      // Execute the request via our server endpoints or evaluate directly
      if (testCase.category === 'Authorization / Privacy') {
        const res = await fetch('/api/ai/parent-copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parentId: testCase.parentOrCoachId || 'parent_priya_patel',
            studentId: testCase.requestStudentId,
            userRole: testCase.userRole,
            question: testCase.inputPrompt,
          }),
        });

        let data: any = {};
        if (res.status === 403 || res.status === 401) {
          data = { error: 'Access Denied: Unauthorized cross-student access blocked.' };
        } else {
          data = await res.json();
        }

        const endTime = performance.now();
        const check = testCase.deterministicValidator(data, JSON.stringify(data));
        return {
          passed: check.passed,
          reason: check.reason,
          durationMs: Math.round(endTime - startTime),
          outputSummary: JSON.stringify(data).slice(0, 140) + '...',
        };
      }

      if (testCase.category === 'Structured Output Validity') {
        const res = await fetch('/api/ai/parent-copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parentId: 'parent_priya_patel',
            studentId: 'student_maya_patel',
            userRole: 'parent',
            question: testCase.inputPrompt,
          }),
        });
        const data = await res.json();
        const endTime = performance.now();
        const check = testCase.deterministicValidator(data);
        return {
          passed: check.passed,
          reason: check.reason,
          durationMs: Math.round(endTime - startTime),
          outputSummary: `Facts: ${data.facts?.length || 0}, Obs: ${data.observations?.length || 0}, Sugs: ${data.suggestions?.length || 0}`,
        };
      }

      if (testCase.category === 'Correct Agent Action') {
        const res = await fetch('/api/ai/balance-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: testCase.requestStudentId,
            userRole: testCase.userRole,
            message: testCase.inputPrompt,
          }),
        });
        const data = await res.json();
        const endTime = performance.now();
        const check = testCase.deterministicValidator(data);
        return {
          passed: check.passed,
          reason: check.reason,
          durationMs: Math.round(endTime - startTime),
          outputSummary: data.message?.slice(0, 120) + '...',
        };
      }

      // Default: AI Tutor or General Context / Reasoning
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: testCase.requestStudentId,
          userRole: testCase.userRole,
          subject: 'Mathematics',
          topic: 'Geometry',
          question: testCase.inputPrompt,
          mastery: 64,
        }),
      });
      const data = await res.json();
      const endTime = performance.now();
      const check = testCase.deterministicValidator(data, data.text);
      return {
        passed: check.passed,
        reason: check.reason,
        durationMs: Math.round(endTime - startTime),
        outputSummary: data.text?.slice(0, 120) + '...',
      };
    } catch (err: any) {
      const endTime = performance.now();
      return {
        passed: false,
        reason: `Execution failed: ${err.message}`,
        durationMs: Math.round(endTime - startTime),
      };
    }
  };

  const handleRunAll = async () => {
    setRunning(true);
    const newResults: Record<string, TestResult> = {};

    for (const testCase of EVALUATION_CASES) {
      const res = await runSingleTest(testCase);
      newResults[testCase.id] = res;
      setResults({ ...newResults });
    }

    setRunning(false);
  };

  const handleRunSingle = async (testCase: EvalCase) => {
    const res = await runSingleTest(testCase);
    setResults((prev) => ({ ...prev, [testCase.id]: res }));
  };

  const totalTested = Object.keys(results).length;
  const passCount = Object.values(results).filter((r) => r.passed).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E2E8F0] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E5E7EB] bg-[#FAF9F6] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#1E293B] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-semibold text-[#1A1A1A]">
                  StudentOS AI Evaluation & Reliability Framework
                </h2>
                <span className="text-[11px] font-mono bg-[#E2E8F0] text-[#334155] px-2 py-0.5 rounded">
                  16 Test Cases
                </span>
              </div>
              <p className="text-xs text-[#525252] mt-0.5">
                Deterministic validation covering factual answers, hallucination resistance, authorization boundaries, structured output schemas, and agent action safety.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#1A1A1A] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Scorecard Bar */}
        <div className="p-4 bg-white border-b border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRunAll}
              disabled={running}
              className="px-4 py-2 bg-[#1E293B] hover:bg-[#0F172A] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <Play className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
              <span>{running ? 'Running Test Suite...' : 'Run All 16 Evaluations'}</span>
            </button>

            {totalTested > 0 && (
              <span className="text-xs font-medium text-[#475569]">
                Score:{' '}
                <strong className={passCount === totalTested ? 'text-emerald-700' : 'text-amber-700'}>
                  {passCount} / {totalTested} Passed
                </strong>{' '}
                ({Math.round((passCount / totalTested) * 100)}%)
              </span>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex overflow-x-auto space-x-1">
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[11px] px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#1E293B] text-white font-medium'
                    : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Test Cases Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="divide-y divide-[#F1F5F9] border border-[#E5E7EB] rounded-lg overflow-hidden bg-white text-xs">
            {filteredCases.map((tc, index) => {
              const res = results[tc.id];
              return (
                <div
                  key={tc.id}
                  onClick={() => setSelectedCase(tc)}
                  className="p-3.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="flex items-start space-x-3">
                    {/* Status Badge */}
                    <div className="mt-0.5">
                      {res ? (
                        res.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-dashed border-[#94A3B8]" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-[#1A1A1A]">
                          #{index + 1} {tc.description}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#F1F5F9] text-[#64748B] rounded">
                          {tc.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        <span className="font-medium text-[#475569]">Prompt: </span>"{tc.inputPrompt}"
                      </p>
                      {res && (
                        <p
                          className={`text-[11px] mt-1 font-medium ${
                            res.passed ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {res.passed ? '✓ ' : '✗ '} {res.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Trigger Single Test */}
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    {res && (
                      <span className="text-[11px] text-[#94A3B8] font-mono">
                        {res.durationMs}ms
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunSingle(tc);
                      }}
                      className="px-2.5 py-1 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] rounded text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      Run Test
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Case Deep Dive Drawer */}
        {selectedCase && (
          <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-[#1A1A1A]">
                Test Detail: {selectedCase.description}
              </span>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-[11px] text-[#64748B] hover:text-[#1A1A1A]"
              >
                Close Inspector
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-[#64748B] font-medium">Expected Assertion:</span>
                <p className="text-[#1A1A1A] mt-0.5">{selectedCase.expectedAssertion}</p>
              </div>
              <div>
                <span className="text-[#64748B] font-medium">Last Run Output Summary:</span>
                <p className="text-[#334155] font-mono mt-0.5 truncate">
                  {results[selectedCase.id]?.outputSummary || 'Not executed yet.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
