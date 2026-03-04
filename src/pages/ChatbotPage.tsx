import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Copy, Pencil, Check, ArrowLeft, Bot, User, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import logoImg from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { getSession } from '@/lib/localAuth';
import { createChatCompletionStream } from '@/lib/supabaseFunctions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  editing?: boolean;
  file?: { name: string; url: string };
}

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: { role: string; content: string }[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const stream = await createChatCompletionStream(messages);
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { done: rdone, value } = await reader.read();
    if (rdone) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch { buf = line + "\n" + buf; break; }
    }
  }
  onDone();
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Welcome to FoodPanda Retention Support! 🍽️ I'm your AI assistant powered by Gemini. How can I help you today?\n\nI can help with:\n- 🚚 Delivery issues & delays\n- 💰 Pricing concerns & refunds\n- ⭐ Rating & quality complaints\n- 🎁 Special offers & discounts\n- 🔄 Re-engagement with personalized deals",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Create a Supabase chat_session row when the page mounts
  useEffect(() => {
    const userSession = getSession();
    if (!userSession) return;
    supabase
      .from('chat_sessions')
      .insert({ user_email: userSession.email, title: 'Retention Chat' })
      .select('id')
      .single()
      .then(({ data, error }) => {
        if (error) console.error('Failed to create chat session:', error);
        else if (data) sessionIdRef.current = data.id;
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string, file?: File) => {
    if (!text.trim() && !file) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: file ? `${text}\n[Attached: ${file.name}]` : text,
      timestamp: new Date(),
      file: file ? { name: file.name, url: URL.createObjectURL(file) } : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachedFile(null);
    setIsTyping(true);

    let assistantSoFar = "";
    const chatHistory = [...messages, userMsg]
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }));

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id.startsWith('stream-')) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { id: 'stream-' + Date.now(), role: 'assistant', content: assistantSoFar, timestamp: new Date() }];
      });
    };

    try {
      await streamChat({
        messages: chatHistory,
        onDelta: upsertAssistant,
        onDone: () => {
          setIsTyping(false);
          // Persist both messages to Supabase (fire-and-forget)
          if (sessionIdRef.current) {
            supabase.from('chat_messages').insert([
              { session_id: sessionIdRef.current, role: 'user' as const, content: userMsg.content },
              { session_id: sessionIdRef.current, role: 'assistant' as const, content: assistantSoFar },
            ]).then(({ error }) => { if (error) console.error('Failed to save messages:', error); });
          }
        },
      });
    } catch (e: any) {
      console.error(e);
      setIsTyping(false);
      toast({ title: 'Error', description: e.message || 'Failed to get response', variant: 'destructive' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input, attachedFile || undefined);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied to clipboard!' });
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditText(msg.content);
  };

  const saveEdit = (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: editText } : m)));
    setEditingId(null);
    setEditText('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAttachedFile(file);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="glass border-b border-border px-6 py-3 flex items-center gap-4">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <img src={logoImg} alt="Logo" className="h-8 w-8 rounded-md" />
        <div>
          <h1 className="font-display font-bold text-sm">AI Retention Chatbot</h1>
          <p className="text-xs text-muted-foreground">Powered by Gemini AI • FoodPanda Customer Support</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-success">Online</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[75%] group ${msg.role === 'user' ? 'order-first' : ''}`}>
              <div className={`rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-card border border-border rounded-bl-md shadow-card'
              }`}>
                {editingId === msg.id ? (
                  <div className="flex gap-2">
                    <Input value={editText} onChange={(e) => setEditText(e.target.value)} className="bg-background text-foreground text-sm" />
                    <Button size="sm" variant="ghost" onClick={() => saveEdit(msg.id)}><Check className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
                {msg.file && (
                  <div className="mt-2">
                    {msg.file.name.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
                      <img src={msg.file.url} alt={msg.file.name} className="rounded-lg max-w-[200px]" />
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted text-xs">
                        <Paperclip className="h-3 w-3" /> {msg.file.name}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Actions */}
              <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => copyMessage(msg.content)} className="p-1 rounded text-muted-foreground hover:text-foreground" title="Copy">
                  <Copy className="h-3 w-3" />
                </button>
                {msg.role === 'user' && (
                  <button onClick={() => startEdit(msg)} className="p-1 rounded text-muted-foreground hover:text-foreground" title="Edit">
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                <span className="text-xs text-muted-foreground ml-2">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-secondary-foreground" />
              </div>
            )}
          </motion.div>
        ))}
        {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-card">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 glass">
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-muted rounded-lg text-sm">
            <Paperclip className="h-3 w-3" />
            <span className="truncate">{attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} className="ml-auto text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your issue (delivery, pricing, quality...)"
            className="flex-1"
            disabled={isTyping}
          />
          <Button type="submit" size="icon" disabled={isTyping || (!input.trim() && !attachedFile)}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI Retention Chatbot • Powered by Gemini AI
        </p>
      </div>
    </div>
  );
}
