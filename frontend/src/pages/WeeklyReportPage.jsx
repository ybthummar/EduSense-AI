import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, MessageSquare, Brain, TrendingDown, Flame, ArrowLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function WeeklyReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button 
               onClick={() => navigate('/student')}
               className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 transition-colors"
            >
               <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
               <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
                  <Brain className="h-6 w-6 text-cyan-400" />
                  Weekly AI Analyst
               </h1>
               <p className="text-sm text-slate-400 mt-1">Your personalized academic diagnostic report for this week</p>
            </div>
         </div>
         <Badge variant="primary" className="animate-pulse bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-3 py-1.5 text-sm">
            Live Report
         </Badge>
      </div>

      <Card className="w-full bg-slate-900/60 border border-slate-700/50 mt-4 overflow-hidden">
        <div className="bg-cyan-500/10 border-b border-cyan-500/20 p-6">
           <h2 className="text-lg font-semibold text-cyan-100 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-cyan-400" />
              Summary for {user?.name || 'Student'}
           </h2>
           <p className="text-sm text-cyan-200/70 mt-2 leading-relaxed max-w-2xl">
              Based on your attendance patterns, latest quiz scores, and past performance history, our AI has identified key action areas to optimize your study time and maintain your academic trajectory this week.
           </p>
        </div>
        
        <div className="p-6 space-y-6">
            
            {/* Insight 1: Needs Attention */}
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 transition-all hover:bg-red-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                 <Badge variant="danger">High Priority</Badge>
              </div>
              <div className="flex items-start gap-4 mb-3">
                <div className="h-10 w-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0 border border-red-500/30">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-red-100">Attendance Drop Alert</h4>
                  <p className="text-sm text-red-200/60 mt-1">Your attendance in Machine Learning dropped to 68% this week.</p>
                </div>
              </div>
              <div className="ml-14 bg-slate-950/40 rounded-lg p-4 border border-red-500/10">
                 <p className="text-sm text-slate-300 leading-relaxed">
                    <strong>AI Recommendation:</strong> You need to attend the next 3 consecutive ML lectures to get back above the 75% minimum criteria. Missing another class will put you at high risk for the mid-semester evaluation.
                 </p>
              </div>
            </div>

            {/* Insight 2: Weakness Detected */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 transition-all hover:bg-amber-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                 <Badge variant="warning">Medium Priority</Badge>
              </div>
              <div className="flex items-start gap-4 mb-3">
                <div className="h-10 w-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Target className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-amber-100">Subject Focus Needed</h4>
                  <p className="text-sm text-amber-200/60 mt-1">Recent quiz scores show weakness in Mathematics (Calculus).</p>
                </div>
              </div>
              <div className="ml-14 bg-slate-950/40 rounded-lg p-4 border border-amber-500/10">
                 <p className="text-sm text-slate-300 leading-relaxed mb-3">
                    <strong>AI Recommendation:</strong> Let's review chapters 3 & 4. Your performance on integration concepts was 20% below your usual average.
                 </p>
                 <button onClick={() => navigate('/chat')} className="text-sm font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1">
                    Start Calculus revision with AI Tutor <ArrowUpRight className="h-4 w-4" />
                 </button>
              </div>
            </div>

            {/* Insight 3: Positive Feedback */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 transition-all hover:bg-emerald-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                 <Badge variant="success">On Track</Badge>
              </div>
              <div className="flex items-start gap-4 mb-3">
                <div className="h-10 w-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Flame className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-emerald-100">Strong Progress</h4>
                  <p className="text-sm text-emerald-200/60 mt-1">Great job in Data Structures!</p>
                </div>
              </div>
              <div className="ml-14 bg-slate-950/40 rounded-lg p-4 border border-emerald-500/10">
                 <p className="text-sm text-slate-300 leading-relaxed">
                    Your recent assignment score is 15% above the class average. Keep up the good work on algorithmic complexity analysis.
                 </p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-700/50 flex justify-end">
               <Button onClick={() => navigate('/chat')} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 shadow-lg shadow-cyan-500/20">
                  <MessageSquare className="h-4 w-4" /> Discuss Details with AI Tutor
               </Button>
            </div>

        </div>
      </Card>
    </div>
  );
}