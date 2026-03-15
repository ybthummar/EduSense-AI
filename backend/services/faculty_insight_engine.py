"""
Faculty Insight Engine — Actionable, data-driven insight generation.

Reads computed Gold-layer analytics and produces structured insights
across five categories: teaching strategy, academic support, performance
trends, subject difficulty, and career guidance.

Each insight carries: id, title, category, severity, type, summary,
detail, affected_entities, recommended_action, and supporting_metrics.
"""

from __future__ import annotations
from typing import Any
import uuid


# ── Severity helpers ─────────────────────────────────────────────────────

_SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def _sev(level: str) -> str:
    return level if level in _SEVERITY_ORDER else "medium"


def _insight(
    *,
    title: str,
    category: str,
    severity: str,
    itype: str,
    summary: str,
    detail: str,
    affected_entities: list[dict] | None = None,
    recommended_action: str = "",
    supporting_metrics: dict | None = None,
) -> dict:
    return {
        "id": uuid.uuid4().hex[:12],
        "title": title,
        "category": category,
        "severity": _sev(severity),
        "type": itype,
        "summary": summary,
        "detail": detail,
        "affected_entities": affected_entities or [],
        "recommended_action": recommended_action,
        "supporting_metrics": supporting_metrics or {},
    }


# ═════════════════════════════════════════════════════════════════════════
# ENGINE
# ═════════════════════════════════════════════════════════════════════════


class FacultyInsightEngine:
    """Generate structured, actionable insights from analytics data."""

    def __init__(
        self,
        kpis: dict,
        risk_students: list[dict],
        scatter: list[dict],
        subject_difficulty: list[dict],
        teaching_effectiveness: list[dict],
        weak_topics: list[dict],
        career_readiness: dict,
        timeline: list[dict],
        grade_distribution: list[dict],
        gender_analytics: list[dict],
        department_comparison: list[dict],
        top_performers: list[dict],
        bottom_performers: list[dict],
    ):
        self.kpis = kpis
        self.risk_students = risk_students
        self.scatter = scatter
        self.subject_difficulty = subject_difficulty
        self.teaching = teaching_effectiveness
        self.weak_topics = weak_topics
        self.career = career_readiness
        self.timeline = timeline
        self.grade_dist = grade_distribution
        self.gender = gender_analytics
        self.dept_comp = department_comparison
        self.top_perf = top_performers
        self.bottom_perf = bottom_performers

    # ── public API ───────────────────────────────────────────────────────

    def generate(self) -> dict[str, Any]:
        insights: list[dict] = []
        insights.extend(self._teaching_strategy())
        insights.extend(self._academic_support())
        insights.extend(self._performance_trends())
        insights.extend(self._subject_difficulty_insights())
        insights.extend(self._career_guidance())
        # sort by severity
        insights.sort(key=lambda i: _SEVERITY_ORDER.get(i["severity"], 9))

        recommendations = self._build_recommendations(insights)
        return {"insights": insights, "recommendations": recommendations}

    # ── 1. Teaching Strategy ────────────────────────────────────────────

    def _teaching_strategy(self) -> list[dict]:
        out: list[dict] = []
        avg_marks = self.kpis.get("avg_marks", 0)
        pass_rate = self.kpis.get("pass_rate", 0)

        # Low pass rate
        if pass_rate < 75:
            sev = "critical" if pass_rate < 60 else "high"
            out.append(_insight(
                title=f"Pass rate is {pass_rate:.1f}% — below 75% threshold",
                category="teaching_strategy",
                severity=sev,
                itype="alert",
                summary=f"Only {pass_rate:.1f}% of students are passing. Review teaching methods and assessment patterns.",
                detail="A pass rate below 75% often indicates misalignment between instruction and assessment, or insufficient foundational preparation among students.",
                recommended_action="Analyse subject-level pass rates, identify the weakest subjects, and pilot active-learning techniques (flipped classroom, peer instruction) in those subjects.",
                supporting_metrics={"pass_rate": round(pass_rate, 1), "avg_marks": round(avg_marks, 1)},
            ))

        # Teaching effectiveness gaps
        if self.teaching:
            low_teachers = [t for t in self.teaching if (t.get("effectiveness_score") or 0) < 50]
            if low_teachers:
                names = [t.get("faculty_name") or t.get("faculty_id", "") for t in low_teachers[:5]]
                out.append(_insight(
                    title=f"{len(low_teachers)} faculty member(s) score below 50 on teaching effectiveness",
                    category="teaching_strategy",
                    severity="high",
                    itype="warning",
                    summary="Low effectiveness scores indicate room for pedagogical improvement.",
                    detail=f"Faculty with low scores: {', '.join(names)}. The composite score weights pass rate (40%), normalised marks (30%), and engagement (30%).",
                    affected_entities=[{"type": "faculty", "id": t.get("faculty_id", ""), "name": t.get("faculty_name", "")} for t in low_teachers[:5]],
                    recommended_action="Pair low-scoring faculty with high-performers for peer mentoring. Offer professional development workshops on student engagement.",
                    supporting_metrics={"low_count": len(low_teachers), "avg_effectiveness": round(sum(t.get("effectiveness_score", 0) for t in low_teachers) / max(len(low_teachers), 1), 1)},
                ))

            # Highlight top teacher
            best = self.teaching[0]
            if (best.get("effectiveness_score") or 0) >= 80:
                out.append(_insight(
                    title=f"{best.get('faculty_name', best.get('faculty_id',''))} leads with effectiveness score {best.get('effectiveness_score')}",
                    category="teaching_strategy",
                    severity="low",
                    itype="success",
                    summary="Exemplary teaching performance — consider sharing best practices.",
                    detail=f"Pass rate: {best.get('pass_rate', 0):.1f}%, Avg marks: {best.get('avg_marks', 0):.1f}, Students taught: {best.get('student_count', 0)}.",
                    affected_entities=[{"type": "faculty", "id": best.get("faculty_id", ""), "name": best.get("faculty_name", "")}],
                    recommended_action="Invite this faculty member to conduct a peer workshop or create teaching case studies from their methods.",
                    supporting_metrics={"effectiveness_score": best.get("effectiveness_score", 0)},
                ))

        # Gender disparity
        if len(self.gender) >= 2:
            marks_vals = [g.get("avg_marks", 0) for g in self.gender]
            gap = abs(marks_vals[0] - marks_vals[1])
            if gap > 8:
                lower = min(self.gender, key=lambda g: g.get("avg_marks", 0))
                out.append(_insight(
                    title=f"{gap:.1f}-mark gender gap detected ({lower.get('gender', '')} students scoring lower)",
                    category="teaching_strategy",
                    severity="medium",
                    itype="warning",
                    summary="A significant gap between genders may indicate bias in assessment or support systems.",
                    detail=f"Gender gap of {gap:.1f} marks across {sum(g.get('student_count', 0) for g in self.gender)} students.",
                    recommended_action="Investigate subject-level data to find where the gap originates. Consider inclusive teaching evaluations.",
                    supporting_metrics={"gap": round(gap, 1), "groups": self.gender},
                ))

        return out

    # ── 2. Academic Support ─────────────────────────────────────────────

    def _academic_support(self) -> list[dict]:
        out: list[dict] = []
        at_risk = self.kpis.get("at_risk_count", 0)
        total = self.kpis.get("total_students", 1) or 1
        avg_att = self.kpis.get("avg_attendance", 0)

        # At-risk count
        if at_risk > 0:
            pct = round(at_risk / total * 100, 1)
            sev = "critical" if pct > 30 else ("high" if pct > 15 else "medium")
            critical_students = [s for s in self.risk_students if s.get("risk_level") == "Critical"]
            high_students = [s for s in self.risk_students if s.get("risk_level") == "High"]
            out.append(_insight(
                title=f"{at_risk} students ({pct}%) are at high/critical academic risk",
                category="academic_support",
                severity=sev,
                itype="warning",
                summary=f"{len(critical_students)} Critical + {len(high_students)} High risk students need immediate intervention.",
                detail="Risk is computed from marks (<40→+50, <50→+30, <60→+15) and attendance (<75%→+30, <85%→+10). Critical ≥75, High ≥60.",
                affected_entities=[{"type": "student", "id": s.get("student_id", ""), "name": s.get("name", "")} for s in (critical_students + high_students)[:10]],
                recommended_action="Schedule one-on-one mentoring sessions for Critical risk students this week. Create study groups for High risk students.",
                supporting_metrics={"critical": len(critical_students), "high": len(high_students), "pct_at_risk": pct},
            ))

        # Low attendance
        if avg_att < 75:
            sev = "critical" if avg_att < 60 else "high"
            out.append(_insight(
                title=f"Average attendance is critically low at {avg_att:.1f}%",
                category="academic_support",
                severity=sev,
                itype="alert",
                summary="Attendance below 75% strongly correlates with academic failure.",
                detail="Research shows each 5% increase in attendance correlates with ~3% improvement in marks.",
                recommended_action="Launch an attendance recovery drive. Identify students below 60% for personal outreach. Consider engaging teaching formats.",
                supporting_metrics={"avg_attendance": round(avg_att, 1)},
            ))
        elif avg_att < 85:
            out.append(_insight(
                title=f"Average attendance is {avg_att:.1f}% — monitor closely",
                category="academic_support",
                severity="medium",
                itype="info",
                summary="Attendance is in the caution zone (75–85%). Preventive action is advised.",
                detail="While above the critical threshold, slippage below 75% significantly increases failure risk.",
                recommended_action="Send attendance alerts to students below 80%. Track weekly trends.",
                supporting_metrics={"avg_attendance": round(avg_att, 1)},
            ))

        # Scatter quadrant analysis
        if self.scatter:
            low_att_low_marks = [s for s in self.scatter if s.get("attendance", 100) < 75 and s.get("marks", 100) < 50]
            high_att_low_marks = [s for s in self.scatter if s.get("attendance", 0) >= 75 and s.get("marks", 100) < 50]
            low_att_high_marks = [s for s in self.scatter if s.get("attendance", 100) < 75 and s.get("marks", 0) >= 50]

            if low_att_low_marks:
                out.append(_insight(
                    title=f"{len(low_att_low_marks)} students have both low attendance & low marks",
                    category="academic_support",
                    severity="critical" if len(low_att_low_marks) > 5 else "high",
                    itype="alert",
                    summary="This cluster represents the most at-risk group requiring dual intervention.",
                    detail="Students with both low attendance (<75%) and low marks (<50) rarely recover without active support.",
                    affected_entities=[{"type": "student", "id": s.get("student_id", ""), "name": s.get("name", "")} for s in low_att_low_marks[:10]],
                    recommended_action="Assign dedicated mentors. Contact parents/guardians. Create personalised improvement plans covering both attendance and academics.",
                    supporting_metrics={"count": len(low_att_low_marks)},
                ))

            if high_att_low_marks:
                out.append(_insight(
                    title=f"{len(high_att_low_marks)} students attend regularly but score below 50",
                    category="academic_support",
                    severity="high",
                    itype="warning",
                    summary="These students are engaged but struggling academically — pure academic support is needed.",
                    detail="Good attendance but poor marks often signals comprehension issues, learning difficulties, or assessment anxiety.",
                    affected_entities=[{"type": "student", "id": s.get("student_id", ""), "name": s.get("name", "")} for s in high_att_low_marks[:10]],
                    recommended_action="Offer tutoring and supplementary study materials. Screen for learning difficulties. Consider alternative assessment methods.",
                    supporting_metrics={"count": len(high_att_low_marks)},
                ))

            if low_att_high_marks:
                out.append(_insight(
                    title=f"{len(low_att_high_marks)} talented students have attendance below 75%",
                    category="academic_support",
                    severity="medium",
                    itype="info",
                    summary="These students perform well but are disengaged from class — risk of future decline.",
                    detail="Students who score well despite low attendance may have external advantages, but this pattern is unsustainable.",
                    affected_entities=[{"type": "student", "id": s.get("student_id", ""), "name": s.get("name", "")} for s in low_att_high_marks[:10]],
                    recommended_action="Have informal conversations to understand reasons for absence. Offer leadership roles to increase engagement.",
                    supporting_metrics={"count": len(low_att_high_marks)},
                ))

        return out

    # ── 3. Performance Trends & Learning Gaps ──────────────────────────

    def _performance_trends(self) -> list[dict]:
        out: list[dict] = []

        # Grade distribution skew
        if self.grade_dist:
            left_count = sum(g.get("count", 0) for g in self.grade_dist if g.get("range", "").startswith(("0", "36")))
            total_count = sum(g.get("count", 0) for g in self.grade_dist)
            if total_count > 0:
                left_pct = round(left_count / total_count * 100, 1)
                if left_pct > 30:
                    out.append(_insight(
                        title=f"{left_pct}% of students score below 45 marks",
                        category="trend",
                        severity="high",
                        itype="alert",
                        summary="Grade distribution is heavily left-skewed — a large proportion of students are underperforming.",
                        detail=f"{left_count} out of {total_count} students fall in the 0–45 marks range, indicating systemic academic challenges.",
                        recommended_action="Identify the subjects contributing most failures. Run diagnostic assessments to pinpoint foundational gaps.",
                        supporting_metrics={"below_45_pct": left_pct, "below_45_count": left_count},
                    ))

        # Top-bottom gap
        if self.top_perf and self.bottom_perf:
            top_avg = sum(s.get("avg_marks", 0) for s in self.top_perf) / max(len(self.top_perf), 1)
            bot_avg = sum(s.get("avg_marks", 0) for s in self.bottom_perf) / max(len(self.bottom_perf), 1)
            gap = round(top_avg - bot_avg, 1)
            if gap > 40:
                out.append(_insight(
                    title=f"{gap}-mark gap between top and bottom performers",
                    category="trend",
                    severity="high",
                    itype="warning",
                    summary="A wide performance gap suggests the class has distinct learning sub-groups that need differentiated instruction.",
                    detail=f"Top 5 average: {top_avg:.1f}, Bottom 5 average: {bot_avg:.1f}. This gap demands tailored support for both ends.",
                    recommended_action="Implement differentiated instruction: advanced problems for top performers, remedial support for bottom. Consider peer tutoring programs.",
                    supporting_metrics={"top_avg": round(top_avg, 1), "bottom_avg": round(bot_avg, 1), "gap": gap},
                ))

        # Department comparison outliers
        if len(self.dept_comp) >= 2:
            marks_list = [d.get("avg_marks", 0) for d in self.dept_comp]
            if marks_list:
                best_dept = max(self.dept_comp, key=lambda d: d.get("avg_marks", 0))
                worst_dept = min(self.dept_comp, key=lambda d: d.get("avg_marks", 0))
                dept_gap = round(best_dept.get("avg_marks", 0) - worst_dept.get("avg_marks", 0), 1)
                if dept_gap > 15:
                    out.append(_insight(
                        title=f"{dept_gap}-mark gap between {best_dept.get('department', '')} and {worst_dept.get('department', '')}",
                        category="trend",
                        severity="medium",
                        itype="info",
                        summary="Significant cross-department performance disparity detected.",
                        detail=f"{best_dept.get('department', '')} leads with {best_dept.get('avg_marks', 0):.1f} avg marks, while {worst_dept.get('department', '')} trails at {worst_dept.get('avg_marks', 0):.1f}.",
                        recommended_action=f"Share teaching strategies from {best_dept.get('department', '')}. Audit {worst_dept.get('department', '')} for resource gaps or curriculum issues.",
                        supporting_metrics={"best": best_dept.get("department", ""), "worst": worst_dept.get("department", ""), "gap": dept_gap},
                    ))

        # Weak topic concentration
        if self.weak_topics:
            critical_topics = [t for t in self.weak_topics if t.get("needs_attention")]
            if len(critical_topics) >= 5:
                out.append(_insight(
                    title=f"{len(critical_topics)} topics flagged as needing attention",
                    category="trend",
                    severity="high",
                    itype="warning",
                    summary="Multiple weak topics detected — potential foundational knowledge gaps across subjects.",
                    detail=f"Top weak topics: {', '.join(t.get('topic','') for t in critical_topics[:5])}.",
                    recommended_action="Prioritise the top 3 weak topics for immediate remedial sessions. Create focused practice worksheets.",
                    supporting_metrics={"critical_count": len(critical_topics), "top_topics": [t.get("topic", "") for t in critical_topics[:5]]},
                ))

        return out

    # ── 4. Subject Difficulty ──────────────────────────────────────────

    def _subject_difficulty_insights(self) -> list[dict]:
        out: list[dict] = []
        if not self.subject_difficulty:
            return out

        # Hardest subject
        hardest = self.subject_difficulty[0]
        h_name = hardest.get("subject_name") or hardest.get("subject_id", "Unknown")
        h_diff = hardest.get("difficulty_score", 0)
        h_fail = hardest.get("fail_rate", 0)
        h_marks = hardest.get("avg_marks", 0)

        if h_diff >= 6:
            out.append(_insight(
                title=f"{h_name} is exceptionally difficult (score: {h_diff})",
                category="subject_difficulty",
                severity="critical" if h_diff >= 8 else "high",
                itype="alert",
                summary=f"Difficulty {h_diff}/10, avg marks {h_marks:.1f}, fail rate {h_fail:.1f}%. This subject needs urgent curricular attention.",
                detail=f"{h_name} has the highest difficulty score in the current scope. Students are consistently underperforming.",
                affected_entities=[{"type": "subject", "id": str(hardest.get("subject_id", "")), "name": h_name}],
                recommended_action="Review the syllabus and assessment patterns. Add tutorial sessions. Consider peer-tutoring or TA support.",
                supporting_metrics={"difficulty_score": h_diff, "avg_marks": round(h_marks, 1), "fail_rate": round(h_fail, 1)},
            ))

        # High fail rate subjects
        high_fail_subjects = [s for s in self.subject_difficulty if s.get("fail_rate", 0) > 30]
        if len(high_fail_subjects) > 1:
            names = [str(s.get("subject_name") or s.get("subject_id", "")) for s in high_fail_subjects[:5]]
            out.append(_insight(
                title=f"{len(high_fail_subjects)} subjects have fail rates above 30%",
                category="subject_difficulty",
                severity="high",
                itype="warning",
                summary="Multiple subjects with high failure rates indicate systemic curriculum or preparation issues.",
                detail=f"Affected subjects: {', '.join(names)}.",
                affected_entities=[{"type": "subject", "id": str(s.get("subject_id", "")), "name": str(s.get("subject_name", ""))} for s in high_fail_subjects[:5]],
                recommended_action="Conduct a root-cause analysis per subject. Check if pre-requisite knowledge is adequately covered in prior semesters.",
                supporting_metrics={"count": len(high_fail_subjects), "subjects": names},
            ))

        # Low attendance subjects
        low_att_subjects = [s for s in self.subject_difficulty if s.get("avg_attendance", 100) < 70]
        if low_att_subjects:
            out.append(_insight(
                title=f"{len(low_att_subjects)} subjects have attendance below 70%",
                category="subject_difficulty",
                severity="high",
                itype="warning",
                summary="Chronically low attendance in specific subjects often signals disengagement or scheduling issues.",
                detail=f"Subjects: {', '.join(str(s.get('subject_name', s.get('subject_id',''))) for s in low_att_subjects[:5])}.",
                affected_entities=[{"type": "subject", "id": str(s.get("subject_id", "")), "name": str(s.get("subject_name", ""))} for s in low_att_subjects[:5]],
                recommended_action="Investigate root causes: class timing, teaching style, perceived irrelevance. Survey students.",
                supporting_metrics={"count": len(low_att_subjects)},
            ))

        # Easy subjects (potential for higher challenge)
        easy_subjects = [s for s in self.subject_difficulty if s.get("difficulty_score", 10) < 2.5 and s.get("pass_rate", 0) > 95]
        if len(easy_subjects) >= 3:
            out.append(_insight(
                title=f"{len(easy_subjects)} subjects have very low difficulty with >95% pass rate",
                category="subject_difficulty",
                severity="low",
                itype="info",
                summary="Some subjects may not be challenging students enough. Consider adding advanced components.",
                detail=f"Subjects: {', '.join(str(s.get('subject_name', s.get('subject_id',''))) for s in easy_subjects[:5])}.",
                recommended_action="Introduce project-based assessments or advanced problem sets to stretch top students.",
                supporting_metrics={"count": len(easy_subjects)},
            ))

        return out

    # ── 5. Career Guidance ─────────────────────────────────────────────

    def _career_guidance(self) -> list[dict]:
        out: list[dict] = []
        ready = self.career.get("ready", 0)
        needs_imp = self.career.get("needs_improvement", 0)
        high_pot = self.career.get("high_potential", 0)
        total_career = ready + needs_imp + high_pot

        if total_career == 0:
            return out

        ready_pct = round(ready / total_career * 100, 1)
        needs_pct = round(needs_imp / total_career * 100, 1)

        if needs_pct > 50:
            out.append(_insight(
                title=f"{needs_pct}% of students need improvement in career readiness",
                category="career_guidance",
                severity="high",
                itype="warning",
                summary=f"{needs_imp} students lack sufficient internship, project, and certification experience.",
                detail="Career readiness is computed from internships (25%), projects (20%), DevOps skills (15%), extracurriculars (15%), and certifications (25%).",
                recommended_action="Organise industry connect sessions. Create a certification pathway program. Mandate at least one internship before final year.",
                supporting_metrics={"needs_improvement": needs_imp, "needs_pct": needs_pct, "career_ready": ready},
            ))

        if ready_pct >= 40:
            out.append(_insight(
                title=f"{ready_pct}% of students are career-ready",
                category="career_guidance",
                severity="low",
                itype="success",
                summary=f"{ready} students have strong career profiles across internships, projects, and certifications.",
                detail="These students can serve as peer mentors for the career-readiness improvement program.",
                recommended_action="Nominate career-ready students for campus placement drives and leadership roles.",
                supporting_metrics={"career_ready": ready, "ready_pct": ready_pct},
            ))

        if high_pot > 0:
            out.append(_insight(
                title=f"{high_pot} high-potential students can be fast-tracked",
                category="career_guidance",
                severity="medium",
                itype="info",
                summary="These students have strong academics but limited practical experience — they're one step away from career-ready.",
                detail="High Potential = CGPA ≥7 with moderate readiness score (30–50). A focused push can convert them.",
                recommended_action="Pair with industry mentors. Sponsor certifications. Prioritise for project-based courses.",
                supporting_metrics={"high_potential": high_pot},
            ))

        # Certification gap
        career_students = self.career.get("students", [])
        if career_students:
            zero_cert = [s for s in career_students if (s.get("certifications") or 0) == 0]
            if len(zero_cert) > len(career_students) * 0.4:
                out.append(_insight(
                    title=f"{len(zero_cert)} students have zero certifications",
                    category="career_guidance",
                    severity="medium",
                    itype="warning",
                    summary="Over 40% of students lack any industry certifications — a critical employability gap.",
                    detail="Certifications contribute 25% to the career readiness score and are highly valued by recruiters.",
                    recommended_action="Partner with platforms (Coursera, AWS, Google) for group certification programs at subsidised rates.",
                    supporting_metrics={"zero_cert_count": len(zero_cert), "pct": round(len(zero_cert) / max(len(career_students), 1) * 100, 1)},
                ))

        return out

    # ── Recommendations builder ────────────────────────────────────────

    def _build_recommendations(self, insights: list[dict]) -> list[dict]:
        recs: list[dict] = []
        seen_actions: set[str] = set()

        # Priority mapping
        prio_map = {"critical": "Critical", "high": "High", "medium": "Medium", "low": "Low"}
        category_labels = {
            "teaching_strategy": "Teaching Strategy",
            "academic_support": "Academic Support",
            "trend": "Performance Trends",
            "subject_difficulty": "Subject Difficulty",
            "career_guidance": "Career Guidance",
        }

        for ins in insights:
            action = ins.get("recommended_action", "")
            if not action or action in seen_actions:
                continue
            seen_actions.add(action)

            sev = ins.get("severity", "medium")
            recs.append({
                "action": action,
                "priority": prio_map.get(sev, "Medium"),
                "category": category_labels.get(ins.get("category", ""), ins.get("category", "")),
                "reason": ins.get("summary", ""),
                "impact": _estimate_impact(ins),
                "source_insight_id": ins.get("id", ""),
            })

        return recs


def _estimate_impact(insight: dict) -> str:
    """Return a brief impact statement based on insight category and severity."""
    cat = insight.get("category", "")
    sev = insight.get("severity", "medium")
    impact_map = {
        ("teaching_strategy", "critical"): "Can improve pass rates by 20–30% through pedagogical changes.",
        ("teaching_strategy", "high"): "Faculty development workshops typically yield 10–15% improvement in student outcomes.",
        ("academic_support", "critical"): "Early intervention for at-risk students can prevent 40–60% of failures.",
        ("academic_support", "high"): "Targeted tutoring improves marks by 8–15% on average.",
        ("trend", "high"): "Addressing foundational gaps can lift bottom-quartile performance by 10–20%.",
        ("subject_difficulty", "critical"): "Curricular review and tutorial support can reduce subject failure rates by 25–40%.",
        ("subject_difficulty", "high"): "Focused remedial sessions reduce fail rates by 15–25%.",
        ("career_guidance", "high"): "Internship and certification programs improve placement rates by 30–50%.",
    }
    return impact_map.get((cat, sev), "Implementing this recommendation will have a measurable positive impact on student outcomes.")
