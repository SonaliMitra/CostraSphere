import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, X } from 'lucide-react';
import api from '../api/axios';

export default function Chatbot({ projectContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m CostraSphere AI. Ask me about costs, towers, fiber routes, or deployment planning.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const res = await api.post('/telecom/chat', { message: userMsg });
      setMessages((m) => [...m, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-lavender-500 to-lavender-700 text-white shadow-glow-lg flex items-center justify-center"
      >
        <Bot size={24} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-6 z-50 w-96 max-w-[calc(100vw-3rem)] glass flex flex-col h-[420px] shadow-glow-lg"
          >
            <div className="flex items-center justify-between p-4 border-b border-lavender-100">
              <div className="flex items-center gap-2">
                <Bot className="text-lavender-600" size={20} />
                <span className="font-semibold text-lavender-800">AI Assistant</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm p-3 rounded-xl max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-lavender-600 text-white ml-auto'
                      : 'bg-lavender-50 text-gray-700'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="text-sm p-3 rounded-xl bg-lavender-50 text-gray-500 animate-pulse">Thinking...</div>
              )}
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t border-lavender-100 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about deployment..."
                className="input-field flex-1 py-2 text-sm"
              />
              <button type="submit" disabled={loading} className="btn-primary p-2.5">
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
