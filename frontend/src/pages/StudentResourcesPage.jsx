// src/pages/StudentResourcesPage.jsx
import React from 'react';
import Card from '../components/ui/Card';
import { ExternalLink, Book, FileText, Video } from 'lucide-react';

const resources = [
  {
    subject: 'Data Structures and Algorithms',
    type: 'Book',
    title: 'Introduction to Algorithms (CLRS)',
    link: 'https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/pages/syllabus/',
    icon: Book,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10'
  },
  {
    subject: 'Database Management Systems',
    type: 'Reference',
    title: 'Database System Concepts (Silberschatz)',
    link: 'https://www.db-book.com/',
    icon: FileText,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10'
  },
  {
    subject: 'Machine Learning',
    type: 'Course/PPT',
    title: 'CS229: Machine Learning (Stanford)',
    link: 'https://cs229.stanford.edu/syllabus.html',
    icon: Video,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10'
  },
  {
    subject: 'Computer Networks',
    type: 'Book',
    title: 'Computer Networking: A Top-Down Approach',
    link: 'https://gaia.cs.umass.edu/kurose_ross/',
    icon: Book,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10'
  }
];

export default function StudentResourcesPage() {
  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Department Resources & References
        </h1>
        <p className="mt-2 text-slate-400">
          Access reference books, PPTs, and study materials shared by your faculty for your current subjects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {resources.map((res, i) => (
          <Card key={i} className="hover:border-cyan-400/40 transition-colors group cursor-pointer">
            <div className="p-5 flex items-start gap-4">
              <div className={`p-3 rounded-xl ${res.bg} ${res.color}`}>
                <res.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{res.subject}</span>
                  <span className="px-2 py-1 text-[10px] rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {res.type}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {res.title}
                </h3>
                <a
                  href={res.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  View Resource <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
