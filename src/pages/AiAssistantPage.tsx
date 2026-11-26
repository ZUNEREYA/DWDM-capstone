import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Bot, Send, User } from 'lucide-react';
import { AiChatResponse } from '../types/healthcare';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  source?: 'gemini' | 'fallback';
  modelUsed?: string;
  chart?: AiChatResponse['chart'];
}

const SUGGESTED_QUESTIONS = [
  'Which medical condition is most common?',
  'Which age group has the highest admissions?',
  'How many records have abnormal test results?',
  'What is the average billing amount?',
  'Show monthly admission trends.',
];

const CHART_COLORS = ['#0F2942', '#0284C7', '#10B981', '#D97706', '#64748B'];

export const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am MediBot AI. Ask me any analytical question about the active healthcare dataset — I compute answers directly from your uploaded records and return charts when helpful.',
      source: 'fallback',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendQuestion = async (qText: string) => {
    const trimmed = qText.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      });
      const data: AiChatResponse = await res.json();
      const botMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.answer || 'Unable to compute answer.',
        source: data.source,
        modelUsed: data.modelUsed,
        chart: data.chart,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'Network error while querying MediBot AI.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0F2942]">
          MediBot AI — Healthcare Analytics Assistant
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Natural-language Q&A powered by Gemini API with an automatic deterministic dataset query engine fallback.
        </p>
      </div>

      {/* Suggested Prompts */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => sendQuestion(q)}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-medium text-[#0F2942] bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-lg transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Conversation Area */}
      <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[580px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-[#0F2942] text-white'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-3xl space-y-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`inline-block text-left px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-[#0F2942] text-white'
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  {msg.text.replace(/\*\*/g, '')}
                </div>

                {msg.role === 'assistant' && msg.source && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    Source: {msg.source === 'gemini' ? `Gemini (${msg.modelUsed})` : 'Local Dataset Analytics Engine'}
                  </div>
                )}

                {msg.chart && msg.chart.data && msg.chart.data.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 w-full sm:w-[460px]">
                    <div className="text-xs font-bold text-[#0F2942] mb-2">{msg.chart.title}</div>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        {msg.chart.type === 'line' ? (
                          <LineChart data={msg.chart.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#0284C7" strokeWidth={2} />
                          </LineChart>
                        ) : msg.chart.type === 'pie' ? (
                          <PieChart>
                            <Pie
                              data={msg.chart.data}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={75}
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {msg.chart.data.map((_, idx) => (
                                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        ) : (
                          <BarChart data={msg.chart.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#0F2942" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-xs text-slate-500 font-mono">MediBot AI is analyzing dataset...</div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
          className="p-4 border-t border-slate-200 flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about conditions, age groups, billing, test results, or trends..."
            className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0F2942] hover:bg-sky-900 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
