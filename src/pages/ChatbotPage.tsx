import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Send,
  Copy,
  Pencil,
  Check,
  ArrowLeft,
  Bot,
  User,
  Paperclip,
  X,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import logoImg from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import type {
  ChatbotLocationState,
  ChatCompletionRequest,
  ChatMessagePayload,
  ChatPredictionContext,
} from '@/lib/chatContext';
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

interface ChatSessionRow {
  id: string;
  title: string;
  created_at: string;
}

interface ChatMessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

function buildWelcomeMessage(currentPrediction: ChatPredictionContext | null): Message {
  const contextLine = currentPrediction
    ? `Current context loaded: ${currentPrediction.assessment.riskLevel} risk at ${currentPrediction.assessment.confidence}% confidence.`
    : 'Ask about churn drivers, retention actions, prediction history, or the latest customer risk profile.';

  return {
    id: 'welcome',
    role: 'assistant',
    content: `Welcome to the FoodRetainAI retention copilot.\n\n${contextLine}`,
    timestamp: new Date(),
  };
}

function mapStoredMessage(message: ChatMessageRow): Message {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: new Date(message.created_at),
  };
}

function extractStreamText(parsed: unknown): string {
  if (!parsed || typeof parsed !== 'object') {
    return '';
  }

  if ('text' in parsed && typeof parsed.text === 'string') {
    return parsed.text;
  }

  if (
    'choices' in parsed &&
    Array.isArray(parsed.choices) &&
    parsed.choices[0] &&
    typeof parsed.choices[0] === 'object' &&
    parsed.choices[0] !== null &&
    'delta' in parsed.choices[0] &&
    typeof parsed.choices[0].delta === 'object' &&
    parsed.choices[0].delta !== null &&
    'content' in parsed.choices[0].delta &&
    typeof parsed.choices[0].delta.content === 'string'
  ) {
    return parsed.choices[0].delta.content;
  }

  return '';
}

async function streamChat({
  payload,
  onDelta,
  onDone,
}: {
  payload: ChatCompletionRequest;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const stream = await createChatCompletionStream(payload);
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let isDone = false;

  while (!isDone) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) {
        line = line.slice(0, -1);
      }

      if (line.startsWith(':') || line.trim() === '') {
        continue;
      }

      if (!line.startsWith('data: ')) {
        continue;
      }

      const json = line.slice(6).trim();
      if (json === '[DONE]') {
        isDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(json);
        const text = extractStreamText(parsed);
        if (text) {
          onDelta(text);
        }
      } catch {
        buffer = `${line}\n${buffer}`;
        break;
      }
    }
  }

  onDone();
}

export default function ChatbotPage() {
  const location = useLocation();
  const currentPrediction =
    ((location.state as ChatbotLocationState | null)?.currentPrediction as ChatPredictionContext | undefined) ?? null;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const primarySessionIdRef = useRef<string | null>(null);
  const sessionIdsRef = useRef<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    const loadAccountChat = async () => {
      const userSession = getSession();
      if (!userSession) {
        if (!cancelled) {
          setMessages([buildWelcomeMessage(currentPrediction)]);
          setIsLoadingHistory(false);
        }
        return;
      }

      setIsLoadingHistory(true);

      try {
        const { data: existingSessions, error: sessionsError } = await supabase
          .from('chat_sessions')
          .select('id, title, created_at')
          .eq('user_email', userSession.email)
          .order('created_at', { ascending: true });

        if (sessionsError) {
          throw sessionsError;
        }

        let sessions = (existingSessions ?? []) as ChatSessionRow[];

        if (sessions.length === 0) {
          const sessionTitle = currentPrediction
            ? `${currentPrediction.assessment.prediction} retention chat`
            : 'Retention Chat';

          const { data: createdSession, error: createError } = await supabase
            .from('chat_sessions')
            .insert({ user_email: userSession.email, title: sessionTitle })
            .select('id, title, created_at')
            .single();

          if (createError) {
            throw createError;
          }

          sessions = createdSession ? [createdSession as ChatSessionRow] : [];
        }

        const sessionIds = sessions.map((session) => session.id);
        sessionIdsRef.current = sessionIds;
        primarySessionIdRef.current = sessionIds[0] ?? null;

        let loadedMessages: Message[] = [];
        if (sessionIds.length > 0) {
          const { data: storedMessages, error: messagesError } = await supabase
            .from('chat_messages')
            .select('id, session_id, role, content, created_at')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: true });

          if (messagesError) {
            throw messagesError;
          }

          loadedMessages = ((storedMessages ?? []) as ChatMessageRow[]).map(mapStoredMessage);
        }

        if (!cancelled) {
          setMessages(loadedMessages.length > 0 ? loadedMessages : [buildWelcomeMessage(currentPrediction)]);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        if (!cancelled) {
          setMessages([buildWelcomeMessage(currentPrediction)]);
          toast({
            title: 'Failed to load chat history',
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    };

    loadAccountChat();

    return () => {
      cancelled = true;
    };
  }, [currentPrediction, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingHistory]);

  const sendMessage = async (text: string, file?: File) => {
    if ((!text.trim() && !file) || !primarySessionIdRef.current) return;

    const userSession = getSession();
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

    let assistantSoFar = '';
    const requestMessages: ChatMessagePayload[] = [
      { role: 'user', content: userMsg.content },
    ];

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id.startsWith('stream-')) {
          return prev.map((message, index) =>
            index === prev.length - 1 ? { ...message, content: assistantSoFar } : message,
          );
        }

        return [
          ...prev,
          {
            id: `stream-${Date.now()}`,
            role: 'assistant',
            content: assistantSoFar,
            timestamp: new Date(),
          },
        ];
      });
    };

    try {
      await streamChat({
        payload: {
          messages: requestMessages,
          userEmail: userSession?.email,
          sessionId: primarySessionIdRef.current,
          currentPrediction,
        },
        onDelta: upsertAssistant,
        onDone: () => {
          setIsTyping(false);

          if (!primarySessionIdRef.current || !assistantSoFar.trim()) {
            return;
          }

          supabase
            .from('chat_messages')
            .insert([
              { session_id: primarySessionIdRef.current, role: 'user' as const, content: userMsg.content },
              { session_id: primarySessionIdRef.current, role: 'assistant' as const, content: assistantSoFar },
            ])
            .then(({ error }) => {
              if (error) {
                console.error('Failed to save messages:', error);
              }
            });
        },
      });
    } catch (error) {
      console.error(error);
      setIsTyping(false);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage(input, attachedFile || undefined);
  };

  const handleClearChat = async () => {
    if (sessionIdsRef.current.length === 0 || isClearingChat) return;

    const confirmed = window.confirm('Clear all saved chat history for this account?');
    if (!confirmed) return;

    setIsClearingChat(true);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .in('session_id', sessionIdsRef.current);

      if (error) {
        throw error;
      }

      setMessages([buildWelcomeMessage(currentPrediction)]);
      setEditingId(null);
      setEditText('');
      setInput('');
      setAttachedFile(null);
      toast({ title: 'Chat cleared' });
    } catch (error) {
      console.error('Failed to clear chat:', error);
      toast({
        title: 'Failed to clear chat',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsClearingChat(false);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied to clipboard' });
  };

  const startEdit = (message: Message) => {
    setEditingId(message.id);
    setEditText(message.content);
  };

  const saveEdit = (id: string) => {
    setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, content: editText } : message)));
    setEditingId(null);
    setEditText('');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const inputDisabled = isTyping || isLoadingHistory || isClearingChat || !primarySessionIdRef.current;

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="glass border-b border-border px-6 py-3 flex items-center gap-4">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <img src={logoImg} alt="Logo" className="h-8 w-8 rounded-md" />
        <div>
          <h1 className="font-display font-bold text-sm">AI Retention Chatbot</h1>
          <p className="text-xs text-muted-foreground">One persistent chat thread per account</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleClearChat}
            disabled={isLoadingHistory || isClearingChat || sessionIdsRef.current.length === 0}
          >
            {isClearingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Clear Chat
          </Button>
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-success">Online</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {currentPrediction && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">Loaded prediction context</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium border border-border">
                {currentPrediction.assessment.riskLevel} RISK
              </span>
              <span className="text-xs text-muted-foreground">
                {currentPrediction.assessment.confidence}% confidence
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Orders {currentPrediction.customerProfile.totalOrders} | Spend Rs. {currentPrediction.customerProfile.totalSpend} |
              Rating {currentPrediction.customerProfile.rating.toFixed(1)} | Delay {currentPrediction.customerProfile.deliveryDelayMinutes} mins
            </p>
            <p className="mt-2 text-sm">
              Top factors: {currentPrediction.assessment.factors.slice(0, 3).join('; ')}
            </p>
          </div>
        )}

        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading chat history...</span>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[75%] group ${message.role === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-card border border-border rounded-bl-md shadow-card'
                  }`}
                >
                  {editingId === message.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editText}
                        onChange={(event) => setEditText(event.target.value)}
                        className="bg-background text-foreground text-sm"
                      />
                      <Button size="sm" variant="ghost" onClick={() => saveEdit(message.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                  {message.file && (
                    <div className="mt-2">
                      {message.file.name.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
                        <img src={message.file.url} alt={message.file.name} className="rounded-lg max-w-[200px]" />
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted text-xs">
                          <Paperclip className="h-3 w-3" /> {message.file.name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyMessage(message.content)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground"
                    title="Copy"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {message.role === 'user' && (
                    <button
                      onClick={() => startEdit(message)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground"
                      title="Edit"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                  <span className="text-xs text-muted-foreground ml-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              {message.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </motion.div>
          ))
        )}

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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={inputDisabled}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              isLoadingHistory ? 'Loading chat history...' : 'Ask about churn risk, retention strategy, or prediction trends'
            }
            className="flex-1"
            disabled={inputDisabled}
          />
          <Button type="submit" size="icon" disabled={inputDisabled || (!input.trim() && !attachedFile)}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Past account chat loads at the top and new replies continue below
        </p>
      </div>
    </div>
  );
}
