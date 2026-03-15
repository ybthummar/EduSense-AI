import { useState } from 'react';
import { Info, X, Lightbulb, Target, BarChart3, HelpCircle, ChevronDown, Users, BookOpen, TrendingUp, Layers, Briefcase } from 'lucide-react';

// ── Category icons & colors ────────────────────────────────────────────
const CATEGORY_META = {
  teaching_strategy: { label: 'Teaching Strategy', icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-400/30' },
  academic_support:  { label: 'Academic Support', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-400/30' },
  trend:             { label: 'Performance Trends', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-400/30' },
  subject_difficulty:{ label: 'Subject Difficulty', icon: Layers, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-400/30' },
  career_guidance:   { label: 'Career Guidance', icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-400/30' },
};

const SEVERITY_STYLE = {
  critical: 'border-red-400/40 bg-red-500/15 text-red-300',
  high:     'border-orange-400/40 bg-orange-500/15 text-orange-300',
  medium:   'border-amber-400/40 bg-amber-500/15 text-amber-300',
  low:      'border-slate-500/40 bg-slate-600/15 text-slate-300',
};

export { CATEGORY_META, SEVERITY_STYLE };

const EXPLANATIONS = {
  // KPI Cards
  avg_marks: {
    title: 'Average Student Marks',
    what: 'The arithmetic mean of total marks scored by students across all subjects in the selected scope.',
    why: 'Average marks provide a quick gauge of overall academic performance. It helps faculty identify whether the class is performing above or below expected standards.',
    reading: 'A value above 70 indicates healthy performance. Between 50–70 suggests room for improvement. Below 50 signals systemic issues requiring immediate attention.',
    action: 'If below 60, consider reviewing teaching methods, conducting remedial sessions, or adding practice assessments. Compare across departments and semesters to spot trends.',
  },
  pass_rate: {
    title: 'Pass Rate',
    what: 'The percentage of students who cleared (passed) their subjects out of the total enrolled.',
    why: 'Pass rate is the most direct indicator of teaching effectiveness and curriculum accessibility. A low pass rate may indicate content difficulty, weak foundational understanding, or the need for targeted intervention.',
    reading: 'Above 90% is excellent. 75–90% is acceptable. Below 75% needs investigation. A sudden drop compared to previous semesters is a red flag.',
    action: 'Identify subjects with the lowest pass rates. Cross-reference with attendance data. Schedule remedial sessions for subjects with <80% pass rate.',
  },
  avg_attendance: {
    title: 'Average Attendance',
    what: 'The mean attendance percentage across all students and subjects in the selected scope.',
    why: 'Attendance is the strongest predictor of academic success. Research consistently shows that students with >85% attendance perform significantly better.',
    reading: 'Above 85% is healthy. 75–85% needs monitoring. Below 75% is critical and correlates with higher failure rates.',
    action: 'Launch attendance awareness drives. Identify students below 75% for personal outreach. Consider engaging teaching methods to improve class attendance.',
  },
  at_risk: {
    title: 'Students at Risk',
    what: 'Number of students classified as "High" or "Critical" risk based on a composite score of marks and attendance.',
    why: 'Early identification of at-risk students enables proactive intervention before failures occur. This is the most actionable metric on the dashboard.',
    reading: 'Any non-zero value requires attention. The risk score combines mark thresholds (<40: +50, <50: +30, <60: +15) and attendance (<75%: +30, <85%: +10).',
    action: 'Click to view the list of at-risk students. Schedule one-on-one mentoring. Create personalised improvement plans. Notify parents/guardians if appropriate.',
  },
  difficulty_score: {
    title: 'Subject Difficulty Score',
    what: 'An aggregate measure of how difficult subjects are on average, derived from the inverse of average marks scaled to 10.',
    why: 'Identifies whether the overall curriculum difficulty aligns with student capabilities. Consistently high difficulty may require curriculum adjustment.',
    reading: 'Scale of 0–10. Below 3 means most subjects are accessible. 3–5 is moderate. Above 5 suggests significant academic challenges.',
    action: 'Drill into the Subject Difficulty Analyzer to see which specific subjects are driving the score. Focus support on the top 3 hardest subjects.',
  },
  improvement_rate: {
    title: 'Student Improvement Rate',
    what: 'The percentage of students scoring above 50 marks on average — used as a proxy for "maintaining acceptable performance".',
    why: 'Tracks what proportion of students are meeting minimum academic standards. A complement to at-risk count — provides the positive perspective.',
    reading: 'Above 80% means most students are performing adequately. 60–80% signals that a significant minority needs support. Below 60% is concerning.',
    action: 'Compare across semesters to see if improvement programs are working. Celebrate departments with high rates. Focus resources where rates are lowest.',
  },

  // Chart Explanations
  heatmap: {
    title: 'Subject Performance by Semester',
    what: 'A horizontal bar chart ranking all subjects by their average marks, colour-coded by performance band. Green ≥70 (strong), Yellow 50–69 (moderate), Red <50 (weak). Hover to see semester, pass rate, and student count.',
    why: 'Instantly ranks which subjects students excel in and which ones they struggle with. Sorted view makes it easy to spot the weakest subjects that need remedial attention.',
    reading: 'Longer green bars = high-performing subjects. Short red/yellow bars at the bottom = subjects needing intervention. Hover any bar to see the semester it belongs to and its pass rate.',
    action: 'Focus on the shortest / red bars first — review syllabus, assessment difficulty, and teaching approach for those subjects. Compare pass rates to identify whether the issue is widespread or affects only a few students.',
  },
  risk_distribution: {
    title: 'Student Risk Distribution',
    what: 'A donut chart showing how students are distributed across four risk categories: Low, Medium, High, and Critical.',
    why: 'Provides an immediate visual of the overall health of the student body. A healthy department shows most students in Low/Medium risk.',
    reading: 'Low = risk score <40 (safe). Medium = 40–59 (monitor). High = 60–74 (intervene). Critical = ≥75 (urgent action needed).',
    action: 'Click any segment to see the list of students in that category. Prioritise Critical and High-risk students for immediate mentoring.',
  },
  scatter: {
    title: 'Attendance vs Performance Scatter Plot',
    what: 'Each dot represents a student, plotted by their attendance (X-axis) and marks (Y-axis). Colours indicate risk level.',
    why: 'Reveals the relationship between attendance and academic performance. Helps identify four key student clusters.',
    reading: 'Top-right (high att + high marks) = Ideal students. Bottom-left (low att + low marks) = Highest risk. Top-left (low att + high marks) = Talented but disengaged. Bottom-right (high att + low marks) = Need academic support despite good attendance.',
    action: 'Focus on bottom-left cluster for dual intervention. Bottom-right students may need tutoring or assessment support. Top-left students need engagement strategies.',
  },
  subject_difficulty: {
    title: 'Subject Difficulty Analyzer',
    what: 'A ranked view of subjects by difficulty score, combining average marks, pass rate, fail rate, and attendance.',
    why: 'Identifies which subjects are the most challenging for students. Subject-level analysis is more actionable than overall averages.',
    reading: 'Higher difficulty score = harder subject. Look at the combination: low marks + low pass rate + low attendance signals a problematic subject.',
    action: 'For the top 3 hardest subjects: review assessment patterns, provide additional study materials, consider peer tutoring, and evaluate if the teaching approach needs adjustment.',
  },
  timeline: {
    title: 'Student Progress Timeline',
    what: 'A line chart showing how a selected student\'s marks change across semesters.',
    why: 'Trend analysis is more valuable than point-in-time scores. A declining student needs attention even if their current marks are acceptable.',
    reading: 'Upward trend = improvement (encourage). Flat line = consistency. Downward trend = concern (investigate causes). Sudden drops may indicate life events.',
    action: 'For declining students: schedule a one-on-one meeting. For improving: acknowledge their effort. Use trends in parent-teacher meetings as evidence.',
  },
  teaching_effectiveness: {
    title: 'Teaching Effectiveness Score',
    what: 'A composite score for each faculty member calculated as: 40% pass rate + 30% normalised average marks + 30% student engagement.',
    why: 'This is a support metric (not judgement) that helps faculty identify areas for personal professional development.',
    reading: 'Above 80 = excellent teaching outcomes. 60–80 = good with room for improvement. Below 60 = may need support or mentoring.',
    action: 'This score is a guide for self-reflection. Compare your score with peers to identify best practices. Focus on whichever component (pass rate, marks, engagement) is lowest.',
  },
  weak_topics: {
    title: 'Weak Topic Detection',
    what: 'An inferred list of topics/concepts that students find most challenging, derived from subject-level performance patterns.',
    why: 'Topic-level intervention is far more effective than broad subject-level review. Students may pass a subject overall but still have critical gaps in specific topics.',
    reading: 'Topics with difficulty score ≥5.5 are flagged as "needs attention". These are knowledge gaps that could affect future courses.',
    action: 'Add targeted revision sessions for top weak topics. Create practice problems specifically for these areas. Consider flipped-classroom approaches for difficult concepts.',
  },
  career_readiness: {
    title: 'Career Readiness Indicator',
    what: 'Classifies students as Career Ready, High Potential, or Needs Improvement based on a composite of CGPA, internships, projects, certifications, and extracurricular scores.',
    why: 'Academic marks alone don\'t predict career success. This holistic view helps faculty guide students toward employability.',
    reading: 'Career Ready = strong across all dimensions. High Potential = good academics but limited practical experience. Needs Improvement = gaps in multiple areas.',
    action: 'Guide "Needs Improvement" students toward internship/certification opportunities. Encourage "High Potential" students to convert their academic strength into practical skills.',
  },
  insights: {
    title: 'AI Insight Panel',
    what: 'Automatically generated, data-driven observations about the current state of your department/class.',
    why: 'Saves time by surfacing the most important patterns and anomalies that might otherwise be missed in tables and charts.',
    reading: 'Each insight is categorised: Warning (needs attention), Alert (urgent), Info (observation), Success (positive trend).',
    action: 'Use insights as conversation starters in department meetings. Click "Details" on any insight for supporting data and recommended next steps.',
  },
  recommendations: {
    title: 'Intervention Recommendations',
    what: 'Prioritized list of suggested actions based on dashboard data patterns.',
    why: 'Bridges the gap between "data" and "action". Every recommendation includes supporting logic and expected impact.',
    reading: 'High priority = immediate action needed. Medium = should be addressed this semester. Each recommendation shows the data-backed reason.',
    action: 'Implement at least the top 2 High-priority recommendations. Track progress by revisiting this dashboard after interventions.',
  },
  grade_distribution: {
    title: 'Grade Distribution',
    what: 'A histogram showing how many students fall into each marks band (0–35, 36–45, 46–55, 56–65, 66–75, 76–85, 86–100).',
    why: 'Reveals the shape of class performance — whether it\'s a healthy bell curve, right-skewed (most students scoring low), or bimodal (clusters of high and low performers).',
    reading: 'A concentration in the 66–85 range is ideal. Heavy bars on the left (0–45) indicate widespread underperformance. Heavy bars on the right (86–100) suggest the curriculum may need more challenging content.',
    action: 'If distribution skews left, investigate subject-level failure causes. If bimodal, consider differentiated instruction for advanced and struggling groups.',
  },
  top_bottom: {
    title: 'Top & Bottom Performers',
    what: 'Leaderboard showing the 5 highest-scoring and 5 lowest-scoring students based on average total marks.',
    why: 'Quick identification of extremes helps faculty recognize excellence and target support where it\'s needed most.',
    reading: 'Top performers can be highlighted for peer mentoring roles. Bottom performers may need academic counseling, extra tutorials, or personal check-ins.',
    action: 'Pair top performers with bottom performers in study groups. Schedule one-on-one meetings with bottom 5 to understand underlying issues (attendance, stress, personal).',
  },
  gender_analytics: {
    title: 'Gender Performance Analysis',
    what: 'Compares average marks, pass rate, and attendance across gender groups. Also shows the student count per gender.',
    why: 'Ensures equitable academic outcomes. Significant gender gaps may indicate bias in assessment, teaching style, or support systems.',
    reading: 'Differences of >5% in any metric warrant investigation. Equal performance across genders indicates a fair learning environment.',
    action: 'If a gap exists, investigate subject-level data to find where it originates. Consider gender-sensitive mentoring programs or targeted academic support.',
  },
  department_comparison: {
    title: 'Department Comparison',
    what: 'Side-by-side comparison of departments on average marks and pass rate, sorted by performance.',
    why: 'Cross-department benchmarking helps identify best practices from top-performing departments and areas that need structural support.',
    reading: 'Departments with both high marks and high pass rate are performing well. A high pass rate but low marks may indicate lenient grading. Low on both signals systemic issues.',
    action: 'Share teaching strategies from top departments institution-wide. Investigate underperforming departments for resource gaps, faculty issues, or curriculum misalignment.',
  },
};

export default function InsightExplainer({ type, className = '' }) {
  const [open, setOpen] = useState(false);
  const data = EXPLANATIONS[type];
  if (!data) return null;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`group inline-flex items-center gap-1 rounded-lg border border-slate-600/50 bg-slate-800/60 px-2 py-1 text-[11px] font-medium text-slate-400 transition-all hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-300 ${className}`}
        title={`Explain: ${data.title}`}
      >
        <Info className="h-3 w-3" />
        <span className="hidden sm:inline">Explain</span>
      </button>

      {open && (
        <>
          {/* invisible backdrop to close on outside click */}
          <div className="fixed inset-0 z-[99]" onClick={() => setOpen(false)} />

          {/* small popover anchored to button */}
          <div
            className="absolute right-0 top-full z-[100] mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-600/60 bg-slate-900 p-4 shadow-2xl animate-rise-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-0.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/12 text-cyan-300">
                <Lightbulb className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-100 pr-5 leading-tight">{data.title}</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                  <HelpCircle className="h-3 w-3" /> What it represents
                </div>
                <p className="text-slate-300 leading-relaxed">{data.what}</p>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                  <BarChart3 className="h-3 w-3" /> Why it matters
                </div>
                <p className="text-slate-300 leading-relaxed">{data.why}</p>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  <Info className="h-3 w-3" /> How to read it
                </div>
                <p className="text-slate-300 leading-relaxed">{data.reading}</p>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-400">
                  <Target className="h-3 w-3" /> Recommended action
                </div>
                <p className="text-slate-300 leading-relaxed">{data.action}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
