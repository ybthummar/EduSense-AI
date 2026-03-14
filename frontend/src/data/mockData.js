// Mock data for the EduSense AI Dashboard

export const revenueData = [
  { month: 'Jan', revenue: 42500, students: 1200, courses: 85 },
  { month: 'Feb', revenue: 47200, students: 1340, courses: 92 },
  { month: 'Mar', revenue: 51800, students: 1520, courses: 98 },
  { month: 'Apr', revenue: 48900, students: 1450, courses: 95 },
  { month: 'May', revenue: 56300, students: 1680, courses: 110 },
  { month: 'Jun', revenue: 62100, students: 1890, courses: 125 },
  { month: 'Jul', revenue: 58700, students: 1780, courses: 118 },
  { month: 'Aug', revenue: 67400, students: 2050, courses: 135 },
  { month: 'Sep', revenue: 72300, students: 2240, courses: 142 },
  { month: 'Oct', revenue: 69800, students: 2180, courses: 138 },
  { month: 'Nov', revenue: 78500, students: 2420, courses: 155 },
  { month: 'Dec', revenue: 84200, students: 2680, courses: 168 },
];

export const engagementData = [
  { day: 'Mon', active: 845, completed: 320, sessions: 1200 },
  { day: 'Tue', active: 920, completed: 380, sessions: 1350 },
  { day: 'Wed', active: 1050, completed: 450, sessions: 1520 },
  { day: 'Thu', active: 980, completed: 410, sessions: 1420 },
  { day: 'Fri', active: 870, completed: 340, sessions: 1250 },
  { day: 'Sat', active: 640, completed: 220, sessions: 890 },
  { day: 'Sun', active: 580, completed: 180, sessions: 820 },
];

export const courseDistribution = [
  { name: 'Computer Science', value: 35, color: '#3b6cff' },
  { name: 'Mathematics', value: 25, color: '#8b5cf6' },
  { name: 'Data Science', value: 20, color: '#10b981' },
  { name: 'Engineering', value: 12, color: '#f59e0b' },
  { name: 'Business', value: 8, color: '#f43f5e' },
];

export const recentStudents = [
  {
    id: 1,
    name: 'Sarah Chen',
    email: 'sarah.chen@edu.com',
    course: 'Advanced Machine Learning',
    progress: 87,
    status: 'active',
    enrolled: '2026-01-15',
    avatar: 'SC',
  },
  {
    id: 2,
    name: 'James Rodriguez',
    email: 'j.rodriguez@edu.com',
    course: 'Data Structures & Algorithms',
    progress: 62,
    status: 'active',
    enrolled: '2026-02-03',
    avatar: 'JR',
  },
  {
    id: 3,
    name: 'Aisha Patel',
    email: 'a.patel@edu.com',
    course: 'Neural Networks Fundamentals',
    progress: 95,
    status: 'completed',
    enrolled: '2025-11-20',
    avatar: 'AP',
  },
  {
    id: 4,
    name: 'Marcus Thompson',
    email: 'm.thompson@edu.com',
    course: 'Cloud Computing Essentials',
    progress: 34,
    status: 'at-risk',
    enrolled: '2026-02-18',
    avatar: 'MT',
  },
  {
    id: 5,
    name: 'Elena Kowalski',
    email: 'e.kowalski@edu.com',
    course: 'Full-Stack Web Development',
    progress: 76,
    status: 'active',
    enrolled: '2026-01-28',
    avatar: 'EK',
  },
  {
    id: 6,
    name: 'Raj Mehta',
    email: 'r.mehta@edu.com',
    course: 'Cybersecurity Principles',
    progress: 51,
    status: 'active',
    enrolled: '2026-03-01',
    avatar: 'RM',
  },
  {
    id: 7,
    name: 'Olivia Zhang',
    email: 'o.zhang@edu.com',
    course: 'AI Ethics & Society',
    progress: 100,
    status: 'completed',
    enrolled: '2025-10-12',
    avatar: 'OZ',
  },
];

export const notifications = [
  { id: 1, title: 'New enrollment spike detected', desc: 'ML courses up 24% this week', time: '2m ago', type: 'info' },
  { id: 2, title: 'Student at-risk alert', desc: 'Marcus Thompson — low engagement', time: '15m ago', type: 'warning' },
  { id: 3, title: 'Course milestone reached', desc: '1,000 completions in Data Science', time: '1h ago', type: 'success' },
  { id: 4, title: 'System update available', desc: 'v3.2.0 ready to deploy', time: '3h ago', type: 'info' },
];
