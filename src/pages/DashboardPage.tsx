import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, LogOut, MessageSquare, TrendingDown, TrendingUp, Users, DollarSign,
  Star, Package, Activity, X, ChevronRight, Upload, Brain, FileBarChart2,
  LayoutDashboard, ClipboardList, Target, Lightbulb, AlertCircle, CheckCircle2,
  TrendingUp as TrendUp, ArrowUpRight, ArrowDownRight, Download, Menu,
  Trash2, AlertTriangle, Shield, UserPlus,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getAllUsers, deleteUser, signOut, switchAccount, getSession, type LocalUser } from '@/lib/localAuth';
import { loadDataset, computeStats, preprocessRecords, type CustomerRecord, type DatasetStats } from '@/lib/dataset';
import { ChurnCharts } from '@/components/ChurnCharts';
import { PredictionForm } from '@/components/PredictionForm';
import logoImg from '@/assets/logo.png';
import Papa from 'papaparse';

export default function DashboardPage() {
  const [data, setData] = useState<CustomerRecord[]>([]);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [importedData, setImportedData] = useState<CustomerRecord[] | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'eda' | 'predict' | 'insights' | 'data' | 'reports'>('overview');
  const [dataFilter, setDataFilter] = useState<'All' | 'Active' | 'Churned'>('All');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accounts, setAccounts] = useState<LocalUser[]>([]);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocalUser | null>(null);
  const [session, setSession] = useState(() => getSession());
  const tabsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const currentInitials = (session?.name ?? 'U')
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

const refreshAccounts = useCallback(async () => {
    const users = await getAllUsers();
    setAccounts(users);
  }, []);

  useEffect(() => {
    loadDataset().then((records) => {
      setData(records);
      setStats(computeStats(records));
      setLoading(false);
    });
  }, []);

  useEffect(() => { refreshAccounts(); }, [refreshAccounts]);

  const goToTab = (tab: 'overview' | 'eda' | 'predict' | 'insights' | 'data' | 'reports', filter?: 'All' | 'Active' | 'Churned') => {
    setActiveTab(tab);
    if (filter) setDataFilter(filter);
    setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 rounded-xl bg-primary/20 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dataset...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  /* ── per-card chart data ── */
  const COLORS_ACT = 'hsl(142,70%,45%)';
  const COLORS_CHR = 'hsl(0,84%,60%)';
  const COLORS_PIE = ['hsl(210,80%,55%)', 'hsl(270,60%,55%)', 'hsl(38,92%,50%)', 'hsl(16,100%,50%)', COLORS_ACT, COLORS_CHR];

  const cityChurnData = Object.entries(stats.churnByCity)
    .map(([city, v]) => ({ city, Active: v.active, Churned: v.inactive }))
    .sort((a, b) => (b.Active + b.Churned) - (a.Active + a.Churned))
    .slice(0, 8);

  const ageChurnData = Object.entries(stats.churnByAge)
    .map(([age, v]) => ({ age, Active: v.active, Churned: v.inactive, Rate: +(v.inactive / (v.active + v.inactive) * 100).toFixed(1) }))
    .sort((a, b) => a.age.localeCompare(b.age));

  const spendBins = ['0-25K', '25K-50K', '50K-75K', '75K-100K', '100K+'];
  const spendBinData = spendBins.map((label, i) => {
    const ranges = [[0,25000],[25000,50000],[50000,75000],[75000,100000],[100000,Infinity]];
    const [lo, hi] = ranges[i];
    return { range: label, Active: stats.spendByChurn.active.filter(v=>v>=lo&&v<hi).length, Churned: stats.spendByChurn.inactive.filter(v=>v>=lo&&v<hi).length };
  });

  const ratingBinData = [1,2,3,4,5].map(r => ({
    rating: `${r}★`,
    Active: stats.ratingByChurn.active.filter(v=>Math.round(v)===r).length,
    Churned: stats.ratingByChurn.inactive.filter(v=>Math.round(v)===r).length,
  }));

  const freqBins = ['1-5','6-10','11-20','21-30','30+'];
  const freqBinData = freqBins.map((label, i) => {
    const ranges = [[1,5],[6,10],[11,20],[21,30],[30,Infinity]];
    const [lo, hi] = ranges[i];
    return { range: label, Active: stats.frequencyByChurn.active.filter(v=>v>=lo&&v<=hi).length, Churned: stats.frequencyByChurn.inactive.filter(v=>v>=lo&&v<=hi).length };
  });

  const loyaltyBins = ['0-100','101-200','201-300','301-400','400+'];
  const loyaltyBinData = loyaltyBins.map((label, i) => {
    const ranges = [[0,100],[101,200],[201,300],[301,400],[400,Infinity]];
    const [lo, hi] = ranges[i];
    const active = data.filter(r=>r.churned==='Active'&&r.loyalty_points>=lo&&r.loyalty_points<=hi).length;
    const churned = data.filter(r=>r.churned==='Inactive'&&r.loyalty_points>=lo&&r.loyalty_points<=hi).length;
    return { range: label, Active: active, Churned: churned };
  });

  const totalPieData = [
    { name: 'Active', value: stats.activeCustomers },
    { name: 'Churned', value: stats.inactiveCustomers },
  ];

  const activeCityData = Object.entries(stats.churnByCity)
    .map(([city, v]) => ({ city, Active: v.active }))
    .sort((a, b) => b.Active - a.Active).slice(0, 8);

  const churnedCityData = Object.entries(stats.churnByCity)
    .map(([city, v]) => ({ city, Churned: v.inactive }))
    .sort((a, b) => b.Churned - a.Churned).slice(0, 8);

  const cardChartMap: Record<string, { title: string; description: string; chart: React.ReactNode }> = {
    'Total Customers': {
      title: 'Total Customers Breakdown',
      description: 'Active vs Churned split across all customers',
      chart: (
        <div className="flex flex-col items-center gap-6">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={totalPieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`} labelLine>
                <Cell fill={COLORS_ACT} />
                <Cell fill={COLORS_CHR} />
              </Pie>
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-success/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-success">{stats.activeCustomers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Active Customers</p>
            </div>
            <div className="bg-destructive/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{stats.inactiveCustomers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Churned Customers</p>
            </div>
          </div>
        </div>
      ),
    },
    'Active (Retained)': {
      title: 'Active Customers by City',
      description: 'Distribution of retained customers across top cities',
      chart: (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={activeCityData} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="city" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => v.toLocaleString()} />
            <Bar dataKey="Active" fill={COLORS_ACT} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'Inactive (Churned)': {
      title: 'Churned Customers by City',
      description: 'Distribution of churned customers across top cities',
      chart: (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={churnedCityData} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="city" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => v.toLocaleString()} />
            <Bar dataKey="Churned" fill={COLORS_CHR} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'Churn Rate': {
      title: 'Churn Rate by Age Group',
      description: 'How churn rate varies across different age groups',
      chart: (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ageChurnData} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="age" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Active" fill={COLORS_ACT} radius={[4,4,0,0]} stackId="a" />
            <Bar dataKey="Churned" fill={COLORS_CHR} radius={[4,4,0,0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'Total Spend (₹)': {
      title: 'Spend Distribution (₹)',
      description: 'Customer spend ranges for active vs churned customers',
      chart: (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={spendBinData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Active" fill={COLORS_ACT} radius={[4,4,0,0]} />
            <Bar dataKey="Churned" fill={COLORS_CHR} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'Avg Rating': {
      title: 'Rating Distribution',
      description: 'Star ratings given by active vs churned customers',
      chart: (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ratingBinData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="rating" tick={{ fontSize: 13 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Active" fill={COLORS_ACT} radius={[4,4,0,0]} />
            <Bar dataKey="Churned" fill={COLORS_CHR} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'Avg Orders': {
      title: 'Order Frequency Distribution',
      description: 'Number of orders placed by active vs churned customers',
      chart: (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={freqBinData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Active" fill={COLORS_ACT} radius={[4,4,0,0]} />
            <Bar dataKey="Churned" fill={COLORS_CHR} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    'Avg Loyalty Points': {
      title: 'Loyalty Points Distribution',
      description: 'Loyalty points earned by active vs churned customers',
      chart: (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={loyaltyBinData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Active" fill={COLORS_ACT} radius={[4,4,0,0]} />
            <Bar dataKey="Churned" fill={COLORS_CHR} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportStatus(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      Papa.parse<Record<string, unknown>>(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          try {
            const cleaned = preprocessRecords(results.data as Record<string, unknown>[]);
            if (cleaned.length === 0) throw new Error('No valid rows found');
            setData(cleaned);
            setStats(computeStats(cleaned));
            setImportedData(cleaned);
            setImportStatus({ ok: true, msg: `✓ Loaded ${cleaned.length.toLocaleString()} records from "${file.name}"` });
          } catch (err) {
            setImportStatus({ ok: false, msg: `✗ Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}` });
          } finally {
            setImporting(false);
          }
        },
        error: (err) => {
          setImportStatus({ ok: false, msg: `✗ Read error: ${err.message}` });
          setImporting(false);
        },
      });
    };
    reader.onerror = () => {
      setImportStatus({ ok: false, msg: '✗ Could not read file' });
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const summaryCards = [
    { icon: Users,        label: 'Total Customers',    value: stats.totalCustomers.toLocaleString(),            color: 'text-chart-blue',   tabAction: () => goToTab('data', 'All') },
    { icon: TrendingUp,   label: 'Active (Retained)',  value: stats.activeCustomers.toLocaleString(),           color: 'text-success',      tabAction: () => goToTab('data', 'Active') },
    { icon: TrendingDown, label: 'Inactive (Churned)', value: stats.inactiveCustomers.toLocaleString(),         color: 'text-destructive',  tabAction: () => goToTab('data', 'Churned') },
    { icon: Activity,     label: 'Churn Rate',         value: `${stats.churnRate.toFixed(1)}%`,                 color: 'text-warning',      tabAction: () => goToTab('eda') },
    { icon: DollarSign,   label: 'Total Spend (₹)',    value: `₹${(stats.totalSpendRupees / 1e6).toFixed(1)}M`, color: 'text-primary',      tabAction: () => goToTab('eda') },
    { icon: Star,         label: 'Avg Rating',         value: stats.avgRating.toFixed(2),                       color: 'text-chart-orange', tabAction: () => goToTab('eda') },
    { icon: Package,      label: 'Avg Orders',         value: stats.avgOrderFrequency.toFixed(0),               color: 'text-chart-purple', tabAction: () => goToTab('eda') },
    { icon: BarChart3,    label: 'Avg Loyalty Points', value: stats.avgLoyaltyPoints.toFixed(0),                color: 'text-chart-blue',   tabAction: () => goToTab('eda') },
  ];

  /* ── AI Insights computed from dataset ── */
  const lowRatingChurnRate = (() => {
    const lo = stats.ratingByChurn.inactive.filter(r => r < 2).length;
    const total = stats.ratingByChurn.active.filter(r => r < 2).length + lo;
    return total > 0 ? Math.round((lo / total) * 100) : 0;
  })();
  const delayedChurnRate = (() => {
    const del = stats.churnByDeliveryStatus;
    const late = Object.entries(del).filter(([k]) => k.toLowerCase().includes('late') || k.toLowerCase().includes('delay'));
    const ontime = Object.entries(del).filter(([k]) => !k.toLowerCase().includes('late') && !k.toLowerCase().includes('delay'));
    const lateChurn  = late.reduce((s, [, v]) => s + v.inactive / Math.max(v.active + v.inactive, 1), 0) / Math.max(late.length, 1);
    const ontimeChurn = ontime.reduce((s, [, v]) => s + v.inactive / Math.max(v.active + v.inactive, 1), 0) / Math.max(ontime.length, 1);
    return ontimeChurn > 0 ? +(lateChurn / ontimeChurn).toFixed(1) : 0;
  })();
  const highSpendRetention = (() => {
    const hi = stats.spendByChurn.active.filter(v => v >= 75000).length;
    const tot = hi + stats.spendByChurn.inactive.filter(v => v >= 75000).length;
    return tot > 0 ? Math.round((hi / tot) * 100) : 0;
  })();
  const topChurnCity = Object.entries(stats.churnByCity)
    .sort((a, b) => b[1].inactive - a[1].inactive)[0]?.[0] ?? '—';

  const aiInsights = [
    {
      icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200',
      title: `Customers with < 2 rating have ${lowRatingChurnRate}% churn probability`,
      detail: 'Low satisfaction strongly predicts churn. Focus on improving food quality & service.',
      action: 'Review low-rated orders and identify restaurant issues.',
    },
    {
      icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 border-red-200',
      title: `Delayed deliveries lead to ${delayedChurnRate}× higher churn rate`,
      detail: 'Delivery delays are a critical churn driver. Even minor delays significantly increase churn.',
      action: 'Partner with faster delivery services; set strict SLA targets.',
    },
    {
      icon: ({ className }: { className?: string }) => (
        <span className={`font-bold leading-none inline-flex items-center justify-center ${className ?? ''}`}>₹</span>
      ),
      color: 'text-green-600', bg: 'bg-green-50 border-green-200',
      title: `High spenders (₹75K+) have ${highSpendRetention}% retention rate`,
      detail: 'Premium customers show strong loyalty. Invest in VIP programs to retain high-value segments.',
      action: 'Launch exclusive VIP tier with priority support & perks.',
    },
    {
      icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200',
      title: `${topChurnCity} is the city with highest number of churned customers`,
      detail: 'Geographic concentration suggests local service quality issues or competitive pressure.',
      action: `Conduct targeted retention campaign in ${topChurnCity} with localised offers.`,
    },
    {
      icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200',
      title: `Overall churn rate stands at ${stats.churnRate.toFixed(1)}% — monitor monthly trends`,
      detail: `${stats.inactiveCustomers.toLocaleString()} customers lost. Proactive outreach can recover 20-30% of at-risk customers.`,
      action: 'Set up automated churn alerts and weekly cohort analysis.',
    },
  ];

  const sidebarItems = [
    { id: 'overview',  icon: LayoutDashboard, label: 'Overview' },
    { id: 'eda',       icon: BarChart3,        label: 'EDA & Charts' },
    { id: 'predict',   icon: Target,           label: 'Predict Churn' },
    { id: 'insights',  icon: Brain,            label: 'AI Insights' },
    { id: 'data',      icon: ClipboardList,    label: 'Dataset' },
    { id: 'reports',   icon: FileBarChart2,    label: 'Reports' },
  ] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-border h-14">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 rounded-lg hover:bg-muted" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImg} alt="Logo" className="h-7 w-7 rounded-md" />
              <span className="font-display font-bold hidden sm:block">FoodRetain<span className="text-primary">AI</span></span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate('/chatbot')}>
              <MessageSquare className="h-3.5 w-3.5" /> AI Chatbot
            </Button>

            {/* ── Accounts Avatar Dropdown ── */}
            <Popover open={accountsOpen} onOpenChange={(o) => { setAccountsOpen(o); if (o) refreshAccounts(); }}>
              <PopoverTrigger asChild>
                <button
                  className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-opacity ring-2 ring-primary/30 focus:outline-none"
                  title="Accounts"
                >
                  {currentInitials}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={8} className="w-80 p-0 overflow-hidden">
                {/* Current user header */}
                <div className="bg-primary/8 px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {currentInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{session?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">{session?.email ?? '—'}</p>
                    </div>
                    <Shield className="h-4 w-4 text-primary ml-auto flex-shrink-0" />
                  </div>
                </div>

                {/* All accounts list */}
                <div className="max-h-64 overflow-y-auto">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-4 pt-3 pb-1">
                    All Accounts · {accounts.length}
                  </p>
                  {accounts.length === 0 && (
                    <p className="text-xs text-muted-foreground px-4 py-3">No accounts found.</p>
                  )}
                  {accounts.map((acc) => {
                    const ini = acc.name.split(' ').map((w) => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
                    const isCurrent = acc.email.toLowerCase() === (session?.email ?? '').toLowerCase();
                    return (
                      <div
                        key={acc.id}
                        onClick={() => {
                          if (isCurrent) return;
                          const { error } = switchAccount(acc);
                          if (!error) {
                            setSession(getSession());
                            setAccountsOpen(false);
                            toast({ title: `Switched to ${acc.name}`, description: acc.email });
                          }
                        }}
                        className={`flex items-center gap-3 px-4 py-2.5 group transition-colors ${
                          isCurrent
                            ? 'cursor-default'
                            : 'cursor-pointer hover:bg-primary/8 active:bg-primary/15'
                        }`}
                      >
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCurrent ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors'
                        }`}>
                          {ini || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {acc.name}{isCurrent && <span className="ml-1 text-[10px] text-primary font-semibold">(you)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{acc.email}</p>
                        </div>
                        {!isCurrent && (
                          <span className="text-[10px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mr-1">
                            Switch
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(acc); setAccountsOpen(false); }}
                          title="Delete account"
                          className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Footer: add account + sign out */}
                <div className="border-t border-border p-2 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountsOpen(false);
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add another account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountsOpen(false);
                      signOut();
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </nav>

      {/* ── Delete Account Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Delete Account Permanently?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>{' '}
              (<span className="font-mono text-xs">{deleteTarget?.email}</span>) and all associated data.
              This action <strong>cannot be undone</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                const { error } = await deleteUser(deleteTarget.email);
                if (error) {
                  toast({ title: 'Delete failed', description: error, variant: 'destructive' });
                } else {
                  toast({ title: 'Account deleted', description: `${deleteTarget.name} has been removed.` });
                  refreshAccounts();
                }
                setDeleteTarget(null);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-1">
        {/* ── Sidebar ── */}
        <aside className={`
          fixed md:sticky top-14 z-40 h-[calc(100vh-56px)] w-56 bg-background border-r border-border
          flex flex-col transition-transform duration-200 overflow-y-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}>
          <div className="p-3 space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2 mt-1">Navigation</p>
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-auto p-3 border-t border-border">
            <div className="bg-primary/5 rounded-xl p-3">
              <p className="text-xs font-semibold text-primary mb-1">Dataset Loaded</p>
              <p className="text-xs text-muted-foreground">{stats.totalCustomers.toLocaleString()} customers</p>
              <p className="text-xs text-muted-foreground">{stats.churnRate.toFixed(1)}% churn rate</p>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 space-y-6"  ref={tabsRef}>

          {/* ════════════ OVERVIEW ════════════ */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold">Dashboard Overview</h2>
                <p className="text-sm text-muted-foreground">Real-time analytics from your food delivery dataset</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summaryCards.map((c, i) => (
                  <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="hover:shadow-elevated hover:border-primary/40 transition-all cursor-pointer group" onClick={() => setSelectedCard(c.label)}>
                      <CardContent className="pt-5 pb-4 px-5">
                        <div className="flex items-center gap-3 mb-2">
                          <c.icon className={`h-5 w-5 ${c.color}`} />
                          <span className="text-xs text-muted-foreground">{c.label}</span>
                        </div>
                        <div className="text-2xl font-display font-bold">{c.value}</div>
                        <p className="text-xs text-muted-foreground/60 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to view chart →</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Highlight banners */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-success/30 bg-success/5 hover:shadow-elevated hover:border-success/60 transition-all cursor-pointer" onClick={() => goToTab('data', 'Active')}>
                  <CardContent className="py-5 px-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                        <Users className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <p className="font-display text-2xl font-bold text-success">{stats.retainedCount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Customers Retained (Active)</p>
                      </div>
                    </div>
                    <span className="text-xs text-success/60 hidden sm:block">View active →</span>
                  </CardContent>
                </Card>
                <Card className="border-destructive/30 bg-destructive/5 hover:shadow-elevated hover:border-destructive/60 transition-all cursor-pointer" onClick={() => goToTab('data', 'Churned')}>
                  <CardContent className="py-5 px-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                        <TrendingDown className="h-6 w-6 text-destructive" />
                      </div>
                      <div>
                        <p className="font-display text-2xl font-bold text-destructive">{stats.inactiveCustomers.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Customers Churned (Inactive)</p>
                      </div>
                    </div>
                    <span className="text-xs text-destructive/60 hidden sm:block">View churned →</span>
                  </CardContent>
                </Card>
              </div>

              {/* Quick navigation cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: BarChart3, label: 'EDA & Charts', desc: 'Explore visual analytics', id: 'eda' as const, color: 'text-blue-500' },
                  { icon: Target, label: 'Predict Churn', desc: 'Run churn predictions', id: 'predict' as const, color: 'text-primary' },
                  { icon: Brain, label: 'AI Insights', desc: 'Data-driven recommendations', id: 'insights' as const, color: 'text-purple-500' },
                  { icon: FileBarChart2, label: 'Reports', desc: 'Summary & export', id: 'reports' as const, color: 'text-teal-500' },
                ].map((item) => (
                  <Card key={item.id} className="hover:shadow-elevated hover:border-primary/40 transition-all cursor-pointer" onClick={() => setActiveTab(item.id)}>
                    <CardContent className="pt-5 pb-4 px-5">
                      <item.icon className={`h-6 w-6 ${item.color} mb-3`} />
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* ════════════ EDA & CHARTS ════════════ */}
          {activeTab === 'eda' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold">EDA & Charts</h2>
                <p className="text-sm text-muted-foreground">Exploratory data analysis of your customer dataset</p>
              </div>
              <ChurnCharts stats={stats} />
            </motion.div>
          )}

          {/* ════════════ PREDICT CHURN ════════════ */}
          {activeTab === 'predict' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold">Predict Churn Risk</h2>
                <p className="text-sm text-muted-foreground">Enter customer attributes to get an instant AI-powered churn prediction</p>
              </div>
              <PredictionForm />
            </motion.div>
          )}

          {/* ════════════ AI INSIGHTS ════════════ */}
          {activeTab === 'insights' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">AI Insights</h2>
                  <p className="text-sm text-muted-foreground">Data-driven patterns discovered from your {stats.totalCustomers.toLocaleString()} customer records</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {aiInsights.map((insight, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Card className={`border ${insight.bg}`}>
                      <CardContent className="pt-5 pb-4 px-5">
                        <div className="flex items-start gap-3">
                          <div className={`h-9 w-9 rounded-lg flex-shrink-0 flex items-center justify-center ${insight.bg}`}>
                            <insight.icon className={`h-4.5 w-4.5 ${insight.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm leading-snug mb-1">{insight.title}</p>
                            <p className="text-xs text-muted-foreground mb-2">{insight.detail}</p>
                            <div className="flex items-start gap-1.5">
                              <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                              <p className="text-xs font-medium text-amber-700">{insight.action}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Key stats row */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <TrendUp className="h-4 w-4 text-primary" /> Key Performance Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Retention Rate', value: `${(100 - stats.churnRate).toFixed(1)}%`, icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'Churn Rate', value: `${stats.churnRate.toFixed(1)}%`, icon: ArrowDownRight, color: 'text-red-500', bg: 'bg-red-50' },
                      { label: 'Avg Rating', value: stats.avgRating.toFixed(2), icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                      { label: 'Revenue Risk', value: `₹${((stats.totalSpendRupees * stats.churnRate) / (100 * 1e6)).toFixed(1)}M`, icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-50' },
                    ].map((kpi) => (
                      <div key={kpi.label} className={`${kpi.bg} rounded-xl p-4 text-center`}>
                        <kpi.icon className={`h-5 w-5 ${kpi.color} mx-auto mb-2`} />
                        <p className={`text-xl font-display font-bold ${kpi.color}`}>{kpi.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ════════════ DATASET ════════════ */}
          {activeTab === 'data' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="font-display">Imported Dataset</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                        <Upload className="h-4 w-4" />
                        {importing ? 'Importing…' : 'Import CSV'}
                      </Button>
                      {importedData && (['All', 'Active', 'Churned'] as const).map((f) => (
                        <button key={f} onClick={() => setDataFilter(f)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            dataFilter === f
                              ? f === 'Active' ? 'bg-success text-white border-success'
                                : f === 'Churned' ? 'bg-destructive text-white border-destructive'
                                : 'bg-primary text-white border-primary'
                              : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                          }`}
                        >
                          {f}
                          {f !== 'All' && (
                            <span className="ml-1 opacity-70">
                              ({f === 'Active'
                                ? importedData.filter(r => r.churned === 'Active').length.toLocaleString()
                                : importedData.filter(r => r.churned !== 'Active').length.toLocaleString()})
                            </span>
                          )}
                        </button>
                      ))}
                      {importedData && dataFilter !== 'All' && (
                        <button onClick={() => setDataFilter('All')} className="text-muted-foreground hover:text-foreground">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {importedData && (
                    <p className="text-sm text-muted-foreground">
                      Showing first 1,000 of{' '}
                      {(dataFilter === 'All'
                        ? importedData.length
                        : importedData.filter((r) => r.churned === (dataFilter === 'Churned' ? 'Inactive' : 'Active')).length).toLocaleString()}{' '}
                      {dataFilter !== 'All' && <Badge variant="outline" className="ml-1 text-xs">{dataFilter}</Badge>}
                      {' '}records
                    </p>
                  )}
                  {importStatus && (
                    <div className={`mt-2 text-sm px-3 py-2 rounded-lg font-medium ${
                      importStatus.ok ? 'bg-success/10 text-success border border-success/30' : 'bg-destructive/10 text-destructive border border-destructive/30'
                    }`}>
                      {importStatus.msg}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {!importedData ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-display text-lg font-semibold">No dataset imported yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Import a CSV file to view and explore your data</p>
                      </div>
                      <Button variant="outline" className="gap-2 mt-2" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                        <Upload className="h-4 w-4" /> {importing ? 'Importing…' : 'Import CSV File'}
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-[500px] rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            {['ID','Gender','Age','City','Orders','Price (₹)','Rating','Status','Delivery'].map((h) => (
                              <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(dataFilter === 'All' ? importedData : importedData.filter((r) => r.churned === (dataFilter === 'Churned' ? 'Inactive' : 'Active')))
                            .slice(0, 1000)
                            .map((row, i) => (
                            <tr key={i} className="border-t border-border hover:bg-muted/50 transition-colors">
                              <td className="px-3 py-2 whitespace-nowrap">{row.customer_id}</td>
                              <td className="px-3 py-2">{row.gender}</td>
                              <td className="px-3 py-2">{row.age}</td>
                              <td className="px-3 py-2">{row.city}</td>
                              <td className="px-3 py-2">{row.order_frequency}</td>
                              <td className="px-3 py-2">₹{(row.price * 83).toFixed(0)}</td>
                              <td className="px-3 py-2">{row.rating ?? '—'}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  row.churned === 'Active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                                }`}>{row.churned}</span>
                              </td>
                              <td className="px-3 py-2 text-xs">{row.delivery_status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ════════════ REPORTS ════════════ */}
          {activeTab === 'reports' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">Reports</h2>
                  <p className="text-sm text-muted-foreground">Comprehensive summary of your retention analytics</p>
                </div>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => window.print()}>
                  <Download className="h-4 w-4" /> Export / Print
                </Button>
              </div>

              {/* Executive Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <FileBarChart2 className="h-4 w-4 text-primary" /> Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Total Customers', value: stats.totalCustomers.toLocaleString(), color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Active Customers', value: stats.activeCustomers.toLocaleString(), color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'Churned Customers', value: stats.inactiveCustomers.toLocaleString(), color: 'text-red-600', bg: 'bg-red-50' },
                      { label: 'Churn Rate', value: `${stats.churnRate.toFixed(2)}%`, color: 'text-orange-600', bg: 'bg-orange-50' },
                    ].map((m) => (
                      <div key={m.label} className={`${m.bg} rounded-xl p-4 text-center`}>
                        <p className={`text-2xl font-display font-bold ${m.color}`}>{m.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { label: 'Avg Rating', value: stats.avgRating.toFixed(2), sub: '/ 5.0' },
                      { label: 'Avg Orders / Customer', value: stats.avgOrderFrequency.toFixed(1), sub: 'orders' },
                      { label: 'Avg Loyalty Points', value: stats.avgLoyaltyPoints.toFixed(0), sub: 'pts' },
                      { label: 'Total Revenue', value: `₹${(stats.totalSpendRupees / 1e6).toFixed(2)}M`, sub: '' },
                      { label: 'Avg Spend / Transaction', value: `₹${stats.avgPrice.toFixed(0)}`, sub: '' },
                      { label: 'Revenue at Risk', value: `₹${((stats.totalSpendRupees * stats.churnRate) / (100 * 1e6)).toFixed(2)}M`, sub: 'from churned' },
                    ].map((m) => (
                      <div key={m.label} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <span className="text-sm text-muted-foreground">{m.label}</span>
                        <span className="text-sm font-bold">{m.value} <span className="text-xs font-normal text-muted-foreground">{m.sub}</span></span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Churn Cities */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base">Top 5 Cities by Churn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.churnByCity)
                      .sort((a, b) => b[1].inactive - a[1].inactive)
                      .slice(0, 5)
                      .map(([city, v]) => {
                        const total = v.active + v.inactive;
                        const rate = total > 0 ? Math.round((v.inactive / total) * 100) : 0;
                        return (
                          <div key={city} className="flex items-center gap-3">
                            <span className="text-sm font-medium w-28 flex-shrink-0">{city}</span>
                            <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-destructive/70" style={{ width: `${rate}%` }} />
                            </div>
                            <span className="text-xs font-bold text-destructive w-12 text-right">{rate}% churn</span>
                            <span className="text-xs text-muted-foreground w-16 text-right">{v.inactive.toLocaleString()} lost</span>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Status Report */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base">Delivery Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Delivery Status</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Orders</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Active</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Churned</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Churn %</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Revenue (₹K)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(stats.churnByDeliveryStatus)
                          .sort((a, b) => (b[1].active + b[1].inactive) - (a[1].active + a[1].inactive))
                          .map(([status, v]) => {
                            const total = v.active + v.inactive;
                            const rate = total > 0 ? (v.inactive / total * 100).toFixed(1) : '0.0';
                            const rev = Math.round((stats.revenueByDeliveryStatus[status] ?? 0) / 1000);
                            return (
                              <tr key={status} className="border-b border-border hover:bg-muted/40">
                                <td className="py-2 px-3">{status}</td>
                                <td className="py-2 px-3 text-right">{total.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right text-green-600">{v.active.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right text-red-500">{v.inactive.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right">
                                  <span className={`font-medium ${Number(rate) > 50 ? 'text-red-500' : 'text-green-600'}`}>{rate}%</span>
                                </td>
                                <td className="py-2 px-3 text-right">₹{rev.toLocaleString()}K</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Top Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {[
                      'Immediate action required: Target customers with rating < 2.5 with personalised discount campaigns.',
                      'Invest in delivery SLA improvements — delayed delivery doubles churn risk.',
                      `Focus retention efforts on ${topChurnCity} — highest churn concentration.`,
                      'Upsell loyalty tier upgrades to medium-spend customers (₹25K-50K) to improve retention.',
                      'Deploy AI chatbot proactively for customers with > 30 days since last order.',
                    ].map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>
      </div>

      {/* Card Detail Modal */}
      <AnimatePresence>
        {selectedCard && cardChartMap[selectedCard] && (() => {
          const modal = cardChartMap[selectedCard];
          const card = summaryCards.find(c => c.label === selectedCard)!;
          return (
            <motion.div key="card-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCard(null)} />
              <motion.div
                className="relative z-10 bg-background rounded-2xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 30 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              >
                <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold">{modal.title}</h2>
                      <p className="text-sm text-muted-foreground">{modal.description}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCard(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="px-6 pt-5">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-semibold">
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                    <span className={card.color}>{card.value}</span>
                    <span className="text-muted-foreground font-normal">{card.label}</span>
                  </div>
                </div>
                <div className="px-6 py-5">{modal.chart}</div>
                <div className="px-6 pb-6 flex gap-3">
                  <Button size="sm" className="gap-2" onClick={() => { setSelectedCard(null); card.tabAction(); }}>
                    View Full Analysis <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedCard(null)}>Close</Button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
