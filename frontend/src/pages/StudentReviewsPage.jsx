import React, { useState } from 'react';
import Card from '../components/ui/Card';
import { Star, MessageSquareQuote, ThumbsUp, Send } from 'lucide-react';

const reviewsData = [
  {
    course: 'Machine Learning',
    faculty: 'Prof. Albus Dumbledore',
    date: 'Oct 15, 2025',
    rating: 5,
    review: "The way the concepts of Neural Networks were explained made it very easy to grasp. The hands-on project was incredibly useful.",
    helpful: 12
  },
  {
    course: 'Database Management Systems',
    faculty: 'Prof. Severus Snape',
    date: 'Sep 28, 2025',
    rating: 4,
    review: "Great course overall. The assignments were a bit tough, but they really prepared us for the midterms. SQL queries were taught perfectly.",
    helpful: 8
  },
  {
    course: 'Data Structures and Algorithms',
    faculty: 'Prof. Minerva McGonagall',
    date: 'Aug 10, 2025',
    rating: 5,
    review: "Highly structured and clear. The emphasis on time-complexity analysis early on helped a lot during coding rounds.",
    helpful: 24
  }
];

const faculties = [
  "Prof. Albus Dumbledore",
  "Prof. Severus Snape",
  "Prof. Minerva McGonagall",
  "Prof. Andrew Ng",
  "Prof. Yann LeCun",
  "Dr. Jane Smith",
  "Dr. Emily Davis",
  "Dr. Alan Turing"
];

export default function StudentReviewsPage() {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [rating, setRating] = useState(0);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
            Student Reviews
          </h1>
          <p className="mt-2 text-slate-400">
            Read reviews from other students or share your own feedback about courses and faculties.
          </p>
        </div>
        <button 
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="flex items-center gap-2 rounded-xl bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
        >
          <MessageSquareQuote className="h-4 w-4" />
          {showReviewForm ? 'Cancel Review' : 'Write a Review'}
        </button>
      </div>

      {showReviewForm && (
        <Card className="p-6 border-orange-500/30 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-medium text-orange-400 flex items-center gap-2 mb-4">
            <MessageSquareQuote className="h-5 w-5" /> Submit Your Review
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Target Faculty</label>
                <select className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-200 focus:border-orange-500/50 focus:outline-none">
                  <option value="">Select a Faculty...</option>
                  {faculties.map((faculty, i) => (
                    <option key={i} value={faculty}>{faculty}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Course / Subject Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Data Structures" 
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-200 focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Rating</label>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`w-6 h-6 cursor-pointer transition-all ${
                      star <= (hoverRating || rating) 
                        ? 'fill-orange-400 text-orange-400 scale-110' 
                        : 'text-slate-600 hover:text-orange-400/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Your Feedback</label>
              <textarea 
                rows={4}
                placeholder="Share your experience regarding the teaching style, strictness, marking, etc..." 
                className="w-full rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-200 focus:border-orange-500/50 focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
               <button 
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800"
               >
                 Discard
               </button>
               <button 
                onClick={() => {
                  alert('Thank you! Your anonymous review has been successfully submitted.');
                  setShowReviewForm(false);
                  setRating(0);
                }}
                className="flex items-center gap-2 rounded-xl bg-orange-500 text-slate-950 px-5 py-2 text-sm font-semibold hover:bg-orange-400 transition-colors"
               >
                 <Send className="h-4 w-4" /> Submit Review
               </button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {reviewsData.map((item, index) => (
          <Card key={index} className="p-5 border-orange-500/10 hover:border-orange-500/30 transition-colors">
            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-start mb-3">
              <div>
                <h3 className="text-lg font-medium text-slate-200">{item.course}</h3>
                <p className="text-sm text-slate-400">Taught by <span className="text-slate-300">{item.faculty}</span></p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < item.rating ? 'fill-orange-400 text-orange-400' : 'text-slate-600'}`} 
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500">{item.date}</span>
              </div>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              "{item.review}"
            </p>

            <div className="mt-4 flex items-center justify-end">
              <button className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-orange-400 transition-colors">
                <ThumbsUp className="w-3.5 h-3.5" />
                Helpful ({item.helpful})
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}