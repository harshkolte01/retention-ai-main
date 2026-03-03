import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, LogOut, MessageSquare, TrendingDown, TrendingUp, Users, DollarSign,
  Star, Package, Activity, X, ChevronRight, Upload
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  const [activeTab, setActiveTab] = useState('eda');
  const [dataFilter, setDataFilter] = useState<'All' | 'Active' | 'Churned'>('All');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDataset().then((records) => {
      setData(records);
      setStats(computeStats(records));
      setLoading(false);
    });
  }, []);

  const goToTab = (tab: 'eda' | 'predict' | 'data', filter?: 'All' | 'Active' | 'Churned') => {
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
    { icon: Users, label: 'Total Customers', value: stats.totalCustomers.toLocaleString(), color: 'text-chart-blue', tabAction: () => goToTab('data', 'All') },
    { icon: TrendingUp, label: 'Active (Retained)', value: stats.activeCustomers.toLocaleString(), color: 'text-success', tabAction: () => goToTab('data', 'Active') },
    { icon: TrendingDown, label: 'Inactive (Churned)', value: stats.inactiveCustomers.toLocaleString(), color: 'text-destructive', tabAction: () => goToTab('data', 'Churned') },
    { icon: Activity, label: 'Churn Rate', value: `${stats.churnRate.toFixed(1)}%`, color: 'text-warning', tabAction: () => goToTab('eda') },
    { icon: DollarSign, label: 'Total Spend (₹)', value: `₹${(stats.totalSpendRupees / 1e6).toFixed(1)}M`, color: 'text-primary', tabAction: () => goToTab('eda') },
    { icon: Star, label: 'Avg Rating', value: stats.avgRating.toFixed(2), color: 'text-chart-orange', tabAction: () => goToTab('eda') },
    { icon: Package, label: 'Avg Orders', value: stats.avgOrderFrequency.toFixed(0), color: 'text-chart-purple', tabAction: () => goToTab('eda') },
    { icon: BarChart3, label: 'Avg Loyalty Points', value: stats.avgLoyaltyPoints.toFixed(0), color: 'text-chart-blue', tabAction: () => goToTab('eda') },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-3 px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="Logo" className="h-8 w-8 rounded-md" />
            <span className="font-display font-bold">FoodRetain<span className="text-primary">AI</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/chatbot')}>
              <MessageSquare className="h-4 w-4" /> AI Chatbot
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/')}>
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summaryCards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="hover:shadow-elevated hover:border-primary/40 transition-all cursor-pointer group"
                onClick={() => setSelectedCard(c.label)}
              >
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Active */}
          <Card
            className="border-success/30 bg-success/5 hover:shadow-elevated hover:border-success/60 transition-all cursor-pointer"
            onClick={() => goToTab('data', 'Active')}
          >
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

          {/* Churned */}
          <Card
            className="border-destructive/30 bg-destructive/5 hover:shadow-elevated hover:border-destructive/60 transition-all cursor-pointer"
            onClick={() => goToTab('data', 'Churned')}
          >
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

        {/* Tabs */}
        <div ref={tabsRef}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="eda">📊 EDA & Charts</TabsTrigger>
            <TabsTrigger value="predict">📈 Predict Churn</TabsTrigger>
            <TabsTrigger value="data">📋 Dataset</TabsTrigger>
          </TabsList>

          <TabsContent value="eda">
            <ChurnCharts stats={stats} />
          </TabsContent>

          <TabsContent value="predict">
            <PredictionForm />
          </TabsContent>

          <TabsContent value="data">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="font-display">Imported Dataset</CardTitle>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={importCSV}
                    />
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                      <Upload className="h-4 w-4" />
                      {importing ? 'Importing…' : 'Import CSV'}
                    </Button>
                    {importedData && (['All', 'Active', 'Churned'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setDataFilter(f)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          dataFilter === f
                            ? f === 'Active'
                              ? 'bg-success text-white border-success'
                              : f === 'Churned'
                              ? 'bg-destructive text-white border-destructive'
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
                      : importedData.filter((r) => r.churned === dataFilter).length).toLocaleString()}{' '}
                    {dataFilter !== 'All' && <Badge variant="outline" className="ml-1 text-xs">{dataFilter}</Badge>}
                    {' '}records
                  </p>
                )}
                {importStatus && (
                  <div className={`mt-2 text-sm px-3 py-2 rounded-lg font-medium ${
                    importStatus.ok
                      ? 'bg-success/10 text-success border border-success/30'
                      : 'bg-destructive/10 text-destructive border border-destructive/30'
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
                      <p className="text-sm text-muted-foreground mt-1">Import a CSV file to view and explore your data in table form</p>
                    </div>
                    <Button
                      variant="outline"
                      className="gap-2 mt-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                    >
                      <Upload className="h-4 w-4" />
                      {importing ? 'Importing…' : 'Import CSV File'}
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[500px] rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          {['ID', 'Gender', 'Age', 'City', 'Orders', 'Price (₹)', 'Rating', 'Status', 'Delivery'].map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(dataFilter === 'All' ? importedData : importedData.filter((r) => r.churned === dataFilter))
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
                              }`}>
                                {row.churned}
                              </span>
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
          </TabsContent>
        </Tabs>
        </div>
      </main>

      {/* Card Detail Modal */}
      <AnimatePresence>
        {selectedCard && cardChartMap[selectedCard] && (() => {
          const modal = cardChartMap[selectedCard];
          const card = summaryCards.find(c => c.label === selectedCard)!;
          return (
            <motion.div
              key="card-modal"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Backdrop */}
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setSelectedCard(null)}
              />
              {/* Panel */}
              <motion.div
                className="relative z-10 bg-background rounded-2xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 30 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              >
                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold">{modal.title}</h2>
                      <p className="text-sm text-muted-foreground">{modal.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Stat badge */}
                <div className="px-6 pt-5">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-semibold`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                    <span className={card.color}>{card.value}</span>
                    <span className="text-muted-foreground font-normal">{card.label}</span>
                  </div>
                </div>

                {/* Chart */}
                <div className="px-6 py-5">
                  {modal.chart}
                </div>

                {/* Footer actions */}
                <div className="px-6 pb-6 flex gap-3">
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => { setSelectedCard(null); card.tabAction(); }}
                  >
                    View Full Analysis <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedCard(null)}>
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
