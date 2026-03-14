import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { facultyAPI, studentAPI } from '../services/api';

export default function SuggestionBoxPage() {
  const { user } = useAuth();
  const isFaculty = user?.role === 'faculty';
  const isStudent = user?.role === 'student';

  const [students, setStudents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newSuggestion, setNewSuggestion] = useState({ title: '', description: '', priority: 'medium', topic: 'General' });
  const [message, setMessage] = useState('');

  const loadStudentSuggestions = async (studentId) => {
    try {
      const res = await facultyAPI.getStudentSuggestions(studentId);
      setRecommendations(res.data || []);
    } catch (err) {
      console.error('Unable to load student suggestions', err);
      setRecommendations([]);
    }
  };

  const loadFacultyStudents = useCallback(async () => {
    try {
      const res = await facultyAPI.getStudentsPerformance();
      setStudents(res.data || []);
      if (res.data && res.data.length > 0) {
        const first = res.data[0];
        setSelectedStudent(first);
        await loadStudentSuggestions(first.student_id);
      }
    } catch (err) {
      console.error('Unable to load students', err);
      setStudents([]);
    }
  }, []);

  const loadStudentRecommendations = useCallback(async () => {
    try {
      const res = await studentAPI.getRecommendations(user.student_id || user.id);
      setRecommendations(res.data || []);
    } catch (err) {
      console.error('Unable to load recommendations', err);
      setRecommendations([]);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (isFaculty) {
        await loadFacultyStudents();
      } else if (isStudent) {
        await loadStudentRecommendations();
      }
    };

    fetchData();
  }, [isFaculty, isStudent, loadFacultyStudents, loadStudentRecommendations]);

  const createSuggestion = async () => {
    if (!selectedStudent || !selectedStudent.student_id) return;

    try {
      await facultyAPI.addStudentSuggestion(selectedStudent.student_id, newSuggestion);
      setMessage('Suggestion saved successfully.');
      setNewSuggestion({ title: '', description: '', priority: 'medium', topic: 'General' });
      await loadStudentSuggestions(selectedStudent.student_id);
    } catch (err) {
      console.error(err);
      setMessage('Failed to save suggestion.');
    }
  };

  const priorityVariant = { high: 'danger', medium: 'warning', low: 'info' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Suggestion Box</h1>
        <p className="text-sm text-slate-400">{isFaculty ? 'Create and manage supportive student suggestions.' : 'View your performance recommendations.'}</p>
      </div>

      {isFaculty && (
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Choose Student</CardTitle>
            <CardDescription>Select a student to add or view suggestions</CardDescription>
          </CardHeader>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((stu) => (
              <Button
                key={stu.student_id}
                variant={selectedStudent?.student_id === stu.student_id ? 'secondary' : 'ghost'}
                onClick={() => {
                  setSelectedStudent(stu);
                  loadStudentSuggestions(stu.student_id);
                  setMessage('');
                }}
                className="justify-between"
              >
                {stu.name || stu.first_name + ' ' + stu.last_name}
                {selectedStudent?.student_id === stu.student_id && <Badge variant="success">Selected</Badge>}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {isFaculty && selectedStudent && (
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Add suggestion for {selectedStudent.name || `${selectedStudent.first_name} ${selectedStudent.last_name}`}</CardTitle>
          </CardHeader>

          <div className="space-y-3">
            <input
              value={newSuggestion.title}
              onChange={(e) => setNewSuggestion((o) => ({ ...o, title: e.target.value }))}
              placeholder="Title"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
            />
            <textarea
              rows={4}
              value={newSuggestion.description}
              onChange={(e) => setNewSuggestion((o) => ({ ...o, description: e.target.value }))}
              placeholder="Description"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                value={newSuggestion.topic}
                onChange={(e) => setNewSuggestion((o) => ({ ...o, topic: e.target.value }))}
                placeholder="Topic"
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              />
              <select
                value={newSuggestion.priority}
                onChange={(e) => setNewSuggestion((o) => ({ ...o, priority: e.target.value }))}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <Button onClick={createSuggestion} className="w-full">Save Suggestion</Button>
            </div>
            {message && <p className="text-sm text-green-400">{message}</p>}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <CardHeader>
          <CardTitle>{isFaculty ? 'Student Suggestions' : 'Your Recommendations'}</CardTitle>
          <CardDescription>{isFaculty ? 'Faculty-managed notes and action items' : 'Automatic analytics-based recommendations'}</CardDescription>
        </CardHeader>

        <div className="space-y-3 mt-3">
          {recommendations.length === 0 ? (
            <p className="text-sm text-slate-400">No suggestions found.</p>
          ) : (
            recommendations.map((rec, idx) => (
              <div key={idx} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-100">{rec.title}</h4>
                  <Badge variant={priorityVariant[rec.priority?.toLowerCase()] || 'info'}>{rec.priority || 'Medium'}</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">{rec.description}</p>
                {rec.topic && <p className="mt-1 text-[11px] text-cyan-300">#{rec.topic}</p>}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
