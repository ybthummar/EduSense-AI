// src/pages/FacultyResourcesPage.jsx
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import { Share2, Plus, UploadCloud, Link as LinkIcon, Book } from 'lucide-react';

export default function FacultyResourcesPage() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Share Resources
          </h1>
          <p className="mt-2 text-slate-400">
            Distribute reference books, notes, and PPTs to your students.
          </p>
        </div>
        <button 
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Resource
        </button>
      </div>

      {showUpload && (
        <Card className="p-6 border-emerald-500/30">
          <h2 className="text-lg font-medium text-emerald-400 flex items-center gap-2 mb-4">
            <Share2 className="h-5 w-5" /> New Resource
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Target Department</label>
                <select className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none">
                  <option value="all">All Departments</option>
                  <option value="ce">Computer Engineering</option>
                  <option value="it">Information Technology</option>
                  <option value="me">Mechanical Engineering</option>
                  <option value="cv">Civil Engineering</option>
                  <option value="ee">Electrical Engineering</option>
                  <option value="ec">Electronics and Communication Engineering</option>
                  <option value="ai">Artificial Intelligence and Data Science</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Subject</label>
                <input 
                  type="text" 
                  placeholder="e.g. Machine Learning" 
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Resource Type</label>
                <select className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none">
                  <option value="book">Reference Book</option>
                  <option value="ppt">Presentation / PPT</option>
                  <option value="note">Class Notes</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Title</label>
              <input 
                type="text" 
                placeholder="Title of the resource" 
                className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">External Link</label>
              <div className="flex relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input 
                  type="url" 
                  placeholder="https://..." 
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/50 pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
               <button 
                onClick={() => setShowUpload(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800"
               >
                 Cancel
               </button>
               <button className="flex items-center gap-2 rounded-xl bg-emerald-500 text-slate-950 px-4 py-2 text-sm font-semibold hover:bg-emerald-400 transition-colors">
                 <UploadCloud className="h-4 w-4" /> Share with Students
               </button>
            </div>
          </div>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-medium text-slate-200 mb-4">Recently Shared by You</h3>
        <Card className="divide-y divide-slate-700/50">
            <div className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Book className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">Introduction to Algorithms (CLRS)</p>
                  <p className="text-xs text-slate-400">Data Structures and Algorithms • Shared on Oct 12</p>
                </div>
              </div>
              <button className="text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors">
                Revoke
              </button>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">CS229: Machine Learning (Stanford)</p>
                  <p className="text-xs text-slate-400">Machine Learning • Shared on Sep 29</p>
                </div>
              </div>
              <button className="text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors">
                Revoke
              </button>
            </div>
        </Card>
      </div>

    </div>
  );
}