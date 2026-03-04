import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle, Zap, ShieldAlert, ShieldCheck, Shield,
  TrendingDown, Star, Package, CreditCard, Target, Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { predictChurn } from '@/lib/dataset';
import { supabase } from '@/integrations/supabase/client';
import { getSession } from '@/lib/localAuth';

type PredictResult = ReturnType<typeof predictChurn>;

/* ─── Circular risk gauge ─── */
function RiskGauge({ pct, level }: { pct: number; level: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = level === 'HIGH' ? '#ef4444' : level === 'MEDIUM' ? '#f97316' : '#22c55e';
  const bg    = level === 'HIGH' ? '#fef2f2' : level === 'MEDIUM' ? '#fff7ed' : '#f0fdf4';
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 140, height: 140, background: bg, borderRadius: '50%' }}>
        <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={70} cy={70} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} />
          <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold" style={{ color }}>{pct}%</span>
          <span className="text-xs text-gray-500 font-medium">Churn Risk</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Risk level badge ─── */
function RiskBadge({ level }: { level: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const cfg = {
    HIGH:   { label: 'HIGH RISK',   icon: ShieldAlert,  cls: 'bg-red-100 text-red-700 border-red-300' },
    MEDIUM: { label: 'MEDIUM RISK', icon: Shield,       cls: 'bg-orange-100 text-orange-700 border-orange-300' },
    LOW:    { label: 'LOW RISK',    icon: ShieldCheck,  cls: 'bg-green-100 text-green-700 border-green-300' },
  }[level];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold tracking-wider ${cfg.cls}`}>
      <Icon className="h-3.5 w-3.5" /> {cfg.label}
    </span>
  );
}

const AGE_GROUPS = ['Young Adult (18-25)', 'Adult (26-40)', 'Middle Age (41-55)', 'Senior (56+)'];

export function PredictionForm() {
  const [orders, setOrders]         = useState(20);
  const [spend, setSpend]           = useState(45000);
  const [rating, setRating]         = useState([3.5]);
  const [delay, setDelay]           = useState(15);
  const [loyaltyPoints, setLoyalty] = useState(120);
  const [ageGroup, setAgeGroup]     = useState('Adult (26-40)');
  const [result, setResult]         = useState<PredictResult | null>(null);
  const [running, setRunning]       = useState(false);

  const handlePredict = () => {
    setRunning(true);
    const ag = ageGroup.includes('Senior') ? 'Senior' : 'Adult';
    setTimeout(() => {
      const res = predictChurn(orders, spend, rating[0], delay, loyaltyPoints, ag);
      setResult(res);
      setRunning(false);

      // Persist prediction to Supabase churn_predictions table
      const userSession = getSession();
      if (userSession) {
        supabase.from('churn_predictions').insert({
          user_email: userSession.email,
          order_frequency: orders,
          price: spend,
          rating: rating[0],
          loyalty_points: loyaltyPoints,
          prediction: (res.riskLevel === 'LOW' ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
          confidence: res.confidence,
          model_used: 'Rule-Based Ensemble',
        }).then(({ error }) => { if (error) console.error('Failed to save prediction:', error); });
      }
    }, 600);
  };

  const ratingStars = (val: number) =>
    [1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`h-4 w-4 cursor-pointer transition-colors ${s <= Math.round(val) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
        onClick={() => setRating([s])}
      />
    ));

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── LEFT: Input form ── */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base">Churn Risk Predictor</h3>
            <p className="text-xs text-muted-foreground">Enter customer profile to get AI prediction</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Package className="h-3.5 w-3.5 text-muted-foreground" /> Total Orders
          </Label>
          <Input type="number" value={orders} onChange={(e) => setOrders(Number(e.target.value))} min={0} placeholder="e.g. 20" className="h-9" />
          <p className="text-[11px] text-muted-foreground">Dataset avg: ~15 orders. &lt;10 = high risk signal.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" /> Total Spend (₹)
          </Label>
          <Input type="number" value={spend} onChange={(e) => setSpend(Number(e.target.value))} min={0} placeholder="e.g. 45000" className="h-9" />
          <p className="text-[11px] text-muted-foreground">High spenders (₹50K+) churn significantly less.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            Average Rating: <span className="text-amber-500 font-bold">{rating[0].toFixed(1)}</span>
          </Label>
          <div className="flex items-center gap-2 mb-1">{ratingStars(rating[0])}</div>
          <Slider value={rating} onValueChange={setRating} min={1} max={5} step={0.1} />
          <p className="text-[11px] text-muted-foreground">&lt;2.0 rating → 68% churn probability (dataset insight).</p>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" /> Delivery Delay (mins)
          </Label>
          <Input type="number" value={delay} onChange={(e) => setDelay(Number(e.target.value))} min={0} placeholder="e.g. 15" className="h-9" />
          <div className="flex gap-2 mt-1">
            {[0, 10, 30, 60].map((d) => (
              <button key={d} onClick={() => setDelay(d)}
                className={`flex-1 text-[11px] py-1 rounded border transition-colors ${
                  delay === d ? 'bg-primary text-white border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {d === 0 ? 'On-time' : d === 10 ? 'Slight' : d === 30 ? 'Late' : 'Very Late'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Loyalty Points</Label>
          <Input type="number" value={loyaltyPoints} onChange={(e) => setLoyalty(Number(e.target.value))} min={0} className="h-9" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Age Group</Label>
          <div className="grid grid-cols-2 gap-2">
            {AGE_GROUPS.map((ag) => (
              <button key={ag} onClick={() => setAgeGroup(ag)}
                className={`text-[11px] py-1.5 px-2 rounded border transition-colors text-left ${
                  ageGroup === ag ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-muted text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {ag}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handlePredict} className="w-full h-11 font-semibold text-sm gap-2 mt-1" disabled={running}>
          {running ? (
            <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Analysing...</>
          ) : (
            <><Target className="h-4 w-4" /> Predict Churn Risk</>
          )}
        </Button>
      </div>

      {/* ── RIGHT: Result panel ── */}
      <div className="lg:col-span-3">
        <div className="h-full rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <h3 className="font-display font-bold text-base">Prediction Result</h3>
            {result && <RiskBadge level={result.riskLevel} />}
          </div>
          <div className="p-5">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-14 gap-4 text-center"
                >
                  <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center">
                    <Target className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">No prediction yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Fill in the customer profile and click Predict</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-2 w-full max-w-xs">
                    {[
                      { label: 'LOW', color: 'bg-green-100 text-green-600' },
                      { label: 'MEDIUM', color: 'bg-orange-100 text-orange-600' },
                      { label: 'HIGH', color: 'bg-red-100 text-red-600' },
                    ].map((b) => (
                      <div key={b.label} className={`rounded-lg ${b.color} py-2 text-xs font-bold text-center`}>{b.label}</div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                  {/* Gauge + summary */}
                  <div className="flex items-center gap-6 flex-wrap">
                    <RiskGauge pct={result.confidence} level={result.riskLevel} />
                    <div className="flex-1 min-w-[180px] space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Prediction</p>
                        <div className={`flex items-center gap-2 text-lg font-display font-bold ${
                          result.riskLevel === 'HIGH' ? 'text-red-600' : result.riskLevel === 'MEDIUM' ? 'text-orange-500' : 'text-green-600'
                        }`}>
                          {result.riskLevel === 'HIGH' ? <AlertTriangle className="h-5 w-5" /> :
                           result.riskLevel === 'MEDIUM' ? <Shield className="h-5 w-5" /> :
                           <CheckCircle className="h-5 w-5" />}
                          {result.prediction}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Churn Probability</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                result.riskLevel === 'HIGH' ? 'bg-red-500' : result.riskLevel === 'MEDIUM' ? 'bg-orange-400' : 'bg-green-500'
                              }`}
                              initial={{ width: 0 }} animate={{ width: `${result.confidence}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                          </div>
                          <span className="text-xs font-bold w-10 text-right">{result.confidence}%</span>
                        </div>
                      </div>
                      <RiskBadge level={result.riskLevel} />
                    </div>
                  </div>

                  {/* Risk factors */}
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Risk Factors
                    </p>
                    {result.factors[0] === 'No significant risk factors identified' ? (
                      <p className="text-sm text-green-600 flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" /> No significant risk factors identified
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {result.factors.map((f, i) => (
                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                              result.riskLevel === 'HIGH' ? 'bg-red-500' : result.riskLevel === 'MEDIUM' ? 'bg-orange-400' : 'bg-green-500'
                            }`} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Retention strategies */}
                  <div className={`rounded-lg p-4 ${
                    result.riskLevel === 'HIGH' ? 'bg-red-50 border border-red-200' :
                    result.riskLevel === 'MEDIUM' ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'
                  }`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5 ${
                      result.riskLevel === 'HIGH' ? 'text-red-700' : result.riskLevel === 'MEDIUM' ? 'text-orange-700' : 'text-green-700'
                    }`}>
                      <Lightbulb className="h-3.5 w-3.5" /> Suggested Retention Strategy
                    </p>
                    <ul className="space-y-2">
                      {result.strategies.map((s, i) => (
                        <li key={i} className={`text-sm flex items-start gap-2 ${
                          result.riskLevel === 'HIGH' ? 'text-red-800' : result.riskLevel === 'MEDIUM' ? 'text-orange-800' : 'text-green-800'
                        }`}>
                          <span className="font-bold text-base leading-none mt-0.5">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Score bands */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'LOW RISK',    range: '0–29%',   active: result.riskLevel === 'LOW',    cls: 'bg-green-100 text-green-700 border-green-200' },
                      { label: 'MEDIUM RISK', range: '30–54%',  active: result.riskLevel === 'MEDIUM', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
                      { label: 'HIGH RISK',   range: '55–100%', active: result.riskLevel === 'HIGH',   cls: 'bg-red-100 text-red-700 border-red-200' },
                    ].map((b) => (
                      <div key={b.label} className={`rounded-lg border py-2 px-1 transition-all ${b.cls} ${b.active ? 'ring-2 ring-offset-1' : 'opacity-40'}`}>
                        <p className="text-[10px] font-bold">{b.label}</p>
                        <p className="text-[10px] opacity-75">{b.range}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

