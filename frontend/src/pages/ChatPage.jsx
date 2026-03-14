import { useState, useRef, useEffect } from 'react'
import { Bot, Send, User, Sparkles, Youtube, PlayCircle, Loader2, Lightbulb, ArrowDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const suggestedQuestions = [
  'Explain neural networks',
  'What is recursion?',
  'How does TCP/IP work?',
  'Explain database normalization',
]

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I\'m your AI Learning Assistant powered by RAG and educational resources. Ask me any concepts, topics, or subjects you\'re studying — I\'ll provide explanations and recommend relevant videos.',
      time: formatTime(),
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    setShowScrollBtn(!nearBottom)
  }

  const handleSend = async (e) => {
    e?.preventDefault?.()
    const text = typeof e === 'string' ? e : input.trim()
    if (!text) return

    const userMsg = { id: Date.now(), role: 'user', content: text, time: formatTime() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const isNeural = text.toLowerCase().includes('neural') || text.toLowerCase().includes('network')
      const isRecursion = text.toLowerCase().includes('recursion')
      
      let aiResponse = { id: Date.now() + 1, role: 'assistant', time: formatTime() }

      if (isNeural) {
         aiResponse.content = "Artificial Neural Networks (ANNs) are computing systems inspired by the biological neural networks that constitute animal brains. An ANN is based on a collection of connected units or nodes called artificial neurons, which loosely model the neurons in a biological brain. Each connection, like the synapses in a biological brain, can transmit a signal to other neurons."
         aiResponse.videos = [
           { title: "Neural Networks Explained - Machine Learning Tutorial for Beginners", url: "https://youtube.com/watch?v=aircAruvnKk", thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=100", channel: "Simplilearn" },
           { title: "But what is a neural network? | Chapter 1, Deep learning", url: "https://youtube.com/watch?v=aircAruvnKk", thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100", channel: "3Blue1Brown" }
         ]
         aiResponse.playlist = {
           title: "Deep Learning Complete Course", url: "https://youtube.com/playlist"
         }
      } else if (isRecursion) {
         aiResponse.content = "Recursion is a method of solving a computational problem where the solution depends on solutions to smaller instances of the same problem. A recursive function is one that calls itself within its own code. It typically has a 'base case' to stop the recursion and a 'recursive step' that breaks the problem down."
         aiResponse.videos = [
           { title: "Recursion in 100 Seconds", url: "https://youtube.com/watch", thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=100", channel: "Fireship" },
           { title: "Understand Recursion in 12 Minutes", url: "https://youtube.com/watch", thumbnail: "https://images.unsplash.com/photo-1550439062-609e1531270e?w=100", channel: "Clément Mihailescu" }
         ]
      } else {
         aiResponse.content = `Here is an explanation of "${text}". This relies on foundational principles from standard coursework. The key is to understand how these elements interlock. Would you like me to go deeper into specific examples or mathematical proofs?`
         aiResponse.videos = [
           { title: `Understanding ${text} basics`, url: "https://youtube.com/watch", thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100", channel: "EduTech" }
         ]
      }

      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleSuggestion = (question) => {
    setInput(question)
    handleSend(question)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Chat header */}
      <div className="glass-card card-shine p-4 flex items-center gap-3 mb-4 rounded-xl flex-shrink-0 animate-fade-in-up">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center relative shadow-lg shadow-primary-500/15">
          <Bot className="w-6 h-6 text-white" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-surface-900 rounded-full status-dot-pulse" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-surface-100 flex items-center gap-2">
            AI Learning Assistant <Sparkles className="w-3.5 h-3.5 text-primary-400" />
          </h2>
          <p className="text-xs text-surface-400">Powered by RAG & Educational Resources</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-surface-500">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-800/40 rounded-lg border border-surface-700/20">
            <Sparkles className="w-3 h-3 text-primary-400" />
            <span>RAG</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-800/40 rounded-lg border border-surface-700/20">
            <Youtube className="w-3 h-3 text-red-400" />
            <span>YouTube</span>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto space-y-5 pr-1 chat-scroll relative">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-primary-500/10">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div className={`max-w-[75%] ${msg.role === 'assistant' ? '' : 'flex items-end flex-col'}`}>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'assistant' 
                  ? 'bg-surface-800/50 border border-surface-700/40 bubble-assistant text-surface-200' 
                  : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white bubble-user shadow-lg shadow-primary-500/10'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
              </div>
              <span className="text-[10px] text-surface-600 mt-1.5 px-1">{msg.time}</span>

              {msg.videos && msg.videos.length > 0 && (
                <div className="mt-3 animate-fade-in pl-0.5 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Youtube className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Recommended Videos</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.videos.map((vid, idx) => (
                      <a key={idx} href={vid.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-2.5 bg-surface-800/40 hover:bg-surface-800/70 border border-surface-700/30 hover:border-red-500/20 rounded-xl transition-all group card-shine">
                        <div className="relative w-16 h-12 bg-surface-800 rounded-lg overflow-hidden flex-shrink-0">
                          {vid.thumbnail.startsWith('http') ? (
                            <img src={vid.thumbnail} alt="" className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-xl">{vid.thumbnail}</div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <PlayCircle className="w-5 h-5 text-white/60 group-hover:text-white group-hover:scale-110 transition-all" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-surface-200 line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">{vid.title}</p>
                          <p className="text-[10px] text-surface-500 mt-1 truncate">{vid.channel}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  
                  {msg.playlist && (
                    <div className="mt-2.5 inline-flex">
                       <a href={msg.playlist.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-red-500/8 hover:bg-red-500/15 text-red-400 border border-red-500/15 rounded-lg text-xs font-medium transition-colors group">
                         <PlayCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> Complete Playlist: {msg.playlist.title}
                       </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-surface-600 to-surface-700 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                <User className="w-4 h-4 text-surface-300" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-primary-500/10">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="p-4 rounded-2xl bg-surface-800/50 border border-surface-700/40 bubble-assistant flex items-center gap-3">
               <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
               <span className="text-sm text-surface-400">Searching educational documents & YouTube...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <div className="flex justify-center -mt-12 relative z-10">
          <button onClick={scrollToBottom} className="p-2 rounded-full bg-surface-800/80 border border-surface-700/40 text-surface-400 hover:text-surface-200 shadow-lg backdrop-blur-sm transition-all hover:scale-105 cursor-pointer">
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Suggestion chips */}
      {messages.length <= 1 && !isTyping && (
        <div className="mt-3 flex-shrink-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-surface-500 font-medium">Try asking</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(q)}
                className="px-3.5 py-2 bg-surface-800/40 hover:bg-surface-800/70 border border-surface-700/20 hover:border-primary-500/20 rounded-xl text-xs text-surface-300 hover:text-surface-100 transition-all cursor-pointer hover:shadow-md hover:shadow-primary-500/5"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="mt-4 pt-4 border-t border-surface-800/40 flex-shrink-0">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Explain gradient descent or What is a linked list?"
            className="w-full bg-surface-900/70 border border-surface-700/40 focus:border-primary-500/50 rounded-2xl py-4 pl-5 pr-14 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15 transition-all"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-primary-500 hover:bg-primary-400 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/15 cursor-pointer hover:scale-105"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-center gap-4 mt-3">
           <p className="text-[10px] text-surface-500"><Sparkles className="w-3 h-3 inline text-primary-500 mr-1"/>Explanations via RAG</p>
           <p className="text-[10px] text-surface-500"><Youtube className="w-3 h-3 inline text-red-500 mr-1"/>Videos from YouTube</p>
        </div>
      </div>
    </div>
  )
}
