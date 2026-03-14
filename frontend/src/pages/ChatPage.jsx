import { useState, useRef, useEffect } from 'react'
import { Bot, Send, User, Sparkles, Youtube, PlayCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I am your AI Learning Assistant. Ask me any concepts, topics, or subjects you are studying.',
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg = { id: Date.now(), role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate API delay and AI response with YouTube recommendations
    setTimeout(() => {
      const isNeural = userMsg.content.toLowerCase().includes('neural') || userMsg.content.toLowerCase().includes('network')
      const isRecursion = userMsg.content.toLowerCase().includes('recursion')
      
      let aiResponse = { id: Date.now() + 1, role: 'assistant' }

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
         aiResponse.content = `Here is an explanation of "${userMsg.content}". This relies on foundational principles from standard coursework. The key is to understand how these elements interlock. Would you like me to go deeper into specific examples or mathematical proofs?`
         aiResponse.videos = [
           { title: `Understanding ${userMsg.content} basics`, url: "https://youtube.com/watch", thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100", channel: "EduTech" }
         ]
      }

      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Chat header */}
      <div className="glass-card p-4 flex items-center gap-3 mb-4 rounded-xl flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center relative">
          <Bot className="w-6 h-6 text-white" />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-surface-900 rounded-full"></div>
        </div>
        <div>
          <h2 className="text-lg font-bold text-surface-100 flex items-center gap-2">
            AI Learning Assistant <Sparkles className="w-4 h-4 text-primary-400" />
          </h2>
          <p className="text-sm text-surface-400">Powered by RAG & Educational Resources</p>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            
            <div className={`max-w-[75%] ${msg.role === 'assistant' ? '' : 'flex items-end flex-col'}`}>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'assistant' 
                  ? 'bg-surface-800/60 border border-surface-700/50 rounded-tl-sm text-surface-200 shadow-sm' 
                  : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-tr-sm shadow-md shadow-primary-500/10'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>

              {/* RAG & YouTube Recommendations Payload */}
              {msg.videos && msg.videos.length > 0 && (
                <div className="mt-3 animate-fade-in pl-1">
                  <div className="flex items-center gap-2 mb-2 text-red-400">
                    <Youtube className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Recommended Videos</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {msg.videos.map((vid, idx) => (
                      <a key={idx} href={vid.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-2.5 bg-surface-900/50 hover:bg-surface-800/80 border border-surface-800 hover:border-surface-700 rounded-xl transition-all group">
                        <div className="relative w-16 h-12 bg-surface-800 rounded-lg overflow-hidden flex-shrink-0">
                          {vid.thumbnail.startsWith('http') ? (
                            <img src={vid.thumbnail} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-xl">{vid.thumbnail}</div>
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                            <PlayCircle className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-surface-200 line-clamp-2 leading-snug group-hover:text-primary-400 transition-colors">{vid.title}</p>
                          <p className="text-[10px] text-surface-500 mt-0.5 truncate">{vid.channel}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  
                  {msg.playlist && (
                    <div className="mt-3 inline-flex">
                       <a href={msg.playlist.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors">
                         <PlayCircle className="w-3.5 h-3.5" /> Complete Playlist: {msg.playlist.title}
                       </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0 mt-1 shadow-inner">
                <User className="w-5 h-5 text-surface-300" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="p-4 rounded-2xl bg-surface-800/60 border border-surface-700/50 rounded-tl-sm flex items-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
               <span className="text-sm text-surface-400">Searching educational documents & YouTube...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="mt-4 pt-4 border-t border-surface-800/50 flex-shrink-0">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Explain gradient descent or What is a linked list?"
            className="w-full bg-surface-900 border border-surface-700/50 focus:border-primary-500 rounded-2xl py-4 pl-5 pr-14 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm shadow-surface-950"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary-500 hover:bg-primary-400 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
        <div className="flex items-center justify-center gap-4 mt-3">
           <p className="text-xs text-surface-500"><Sparkles className="w-3 h-3 inline text-primary-500 mr-1"/> Explanations generated via RAG</p>
           <p className="text-xs text-surface-500"><Youtube className="w-3 h-3 inline text-red-500 mr-1"/> Videos sourced from YouTube API</p>
        </div>
      </div>
    </div>
  )
}
