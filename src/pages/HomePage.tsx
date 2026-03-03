import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, BarChart3, Brain, Mail, MessageSquare, Shield, TrendingUp, Users, Github, Linkedin, ExternalLink, GitBranch, TreeDeciduous, Layers, Zap, X, CheckCircle2, ChevronRight, Database, Target, Sparkles, PlayCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoImg from '@/assets/logo.png';
import heroImg from '@/assets/hero-bg.jpg';

function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return { count, ref };
}

const features = [
  {
    icon: BarChart3,
    title: 'Interactive Analytics Dashboard',
    desc: 'Explore deep EDA with 10+ interactive charts — churn by city, age, spend, rating, and order frequency. Every insight is one click away.',
    link: '/features/analytics',
    section: '',
    badge: 'Analytics',
  },
  {
    icon: Brain,
    title: 'ML-Powered Churn Prediction',
    desc: 'Enter any customer profile and get an instant churn probability score from our best-performing Random Forest model (92% accuracy).',
    link: '/features/prediction',
    section: '',
    badge: 'AI / ML',
  },
  {
    icon: MessageSquare,
    title: 'AI Retention Chatbot',
    desc: 'Gemini-powered chatbot that responds to customer queries, offers personalized discounts, and resolves complaints automatically.',
    link: '/features/chatbot',
    section: '',
    badge: 'Chatbot',
  },
  {
    icon: TrendingUp,
    title: 'Live Churn Monitoring',
    desc: 'Monitor active vs churned customer counts, churn rates, and spend metrics in real-time on a centralized dashboard designed for action.',
    link: '/features/monitoring',
    section: '',
    badge: 'Monitoring',
  },
  {
    icon: Users,
    title: 'Smart Customer Segmentation',
    desc: 'Slice your customer base by city, age group, payment method, and order frequency. Identify your highest-risk segments instantly.',
    link: '/features/segmentation',
    section: '',
    badge: 'Segmentation',
  },
  {
    icon: Shield,
    title: 'Automated Retention Actions',
    desc: 'AI-driven playbooks that trigger discount offers, loyalty point boosts, and re-engagement emails automatically when churn risk is detected.',
    link: '/features/retention',
    section: '',
    badge: 'Automation',
  },
];

const stats = [
  { target: 6000, suffix: '+', label: 'Customers Analyzed', link: '/dashboard' },
  { target: 92,   suffix: '%', label: 'Prediction Accuracy', link: '/dashboard' },
  { target: 30,   suffix: '%', label: 'Reduction in Churn',  link: '/dashboard' },
  { target: 20,   suffix: '%', label: 'Increase in Repeat Orders', link: '/dashboard' },
  { target: 3,    suffix: '',  label: 'ML Models Integrated', link: '/dashboard' },
  { target: 24,   suffix: '/7', label: 'AI Chatbot Support',  link: '/chatbot' },
];

const mlModels = [
  {
    icon: GitBranch,
    name: 'Random Forest',
    accuracy: '92%',
    desc: 'Ensemble of decision trees with bagging. Best overall accuracy for churn prediction on tabular data.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    barColor: 'bg-blue-500',
    detail: {
      theory: 'Random Forest is an ensemble method that creates a "forest" of N independent decision trees. Each tree is trained on a random bootstrap sample of rows (bagging) AND a random subset of features at every split (feature randomness). This double randomization makes each tree different and decorrelated. At prediction time, every tree independently classifies the customer as Churned or Active — and the class with the most votes wins. The ensemble effect cancels out individual tree errors, producing a model far more robust than any single tree.',
      howUsed: 'Trained on 6,000 FoodPanda records with 80/20 split. Params (n_estimators=200, max_depth=15, min_samples_split=5) tuned via GridSearchCV. Became the primary production model due to highest F1 on the churned class. SMOTE was applied before training to balance the Active (3,016) vs Churned (2,984) classes.',
      inputFeatures: [
        { name: 'Order Frequency', type: 'Numerical', role: '↑ Orders = ↓ Churn risk' },
        { name: 'Days Since Last Order', type: 'Numerical', role: 'Top predictor — ↑ days = ↑ churn' },
        { name: 'Average Spend (₹)', type: 'Numerical', role: 'Higher spend = more engaged' },
        { name: 'Customer Rating', type: 'Numerical (1–5)', role: 'Low rating = unsatisfied = churn risk' },
        { name: 'Loyalty Points', type: 'Numerical', role: 'High points = loyal customer' },
        { name: 'Delivery Complaints', type: 'Categorical', role: 'Complaint = strong churn signal' },
        { name: 'City Tier', type: 'Categorical', role: 'City-wise churn pattern differences' },
        { name: 'Payment Method', type: 'Categorical', role: 'Proxy for customer behaviour type' },
      ],
      targetOutput: { name: 'Churn Status', values: ['Active (0)', 'Churned (1)'] },
      featureImportance: [
        { feature: 'Order Frequency', pct: 22, color: 'bg-blue-500' },
        { feature: 'Days Since Last Order', pct: 16, color: 'bg-blue-500' },
        { feature: 'Customer Rating', pct: 15, color: 'bg-blue-500' },
        { feature: 'Avg Spend (₹)', pct: 14, color: 'bg-blue-400' },
        { feature: 'Loyalty Points', pct: 12, color: 'bg-blue-400' },
        { feature: 'Delivery Complaints', pct: 10, color: 'bg-blue-300' },
        { feature: 'City Tier', pct: 6, color: 'bg-blue-300' },
        { feature: 'Payment Method', pct: 5, color: 'bg-blue-200' },
      ],
      metrics: [
        { label: 'Accuracy', value: '92%', pct: 92 },
        { label: 'Precision', value: '91%', pct: 91 },
        { label: 'Recall',    value: '93%', pct: 93 },
        { label: 'F1 Score',  value: '92%', pct: 92 },
        { label: 'AUC-ROC',   value: '0.97', pct: 97 },
      ],
      steps: [
        'Data cleaning: handled missing ratings, encoded categorical features',
        'SMOTE applied to handle class imbalance (Active 3,016 vs Churned 2,984)',
        'Feature scaling using StandardScaler on all numerical columns',
        'GridSearchCV with 5-fold CV tuning n_estimators, max_depth, min_samples_split',
        'Final model trained on 80% train set; performance evaluated on 20% held-out test set',
      ],
      insight: '"Order Frequency" and "Days Since Last Order" are the top 2 most important features, together accounting for 38% of all model decisions across 200 trees.',
    },
  },
  {
    icon: Zap,
    name: 'XGBoost',
    accuracy: '91%',
    desc: 'Gradient boosting algorithm. Handles class imbalance and feature interactions extremely well.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    barColor: 'bg-orange-500',
    detail: {
      theory: 'XGBoost (Extreme Gradient Boosting) builds trees sequentially — not independently. Each new tree focuses specifically on the mistakes of all previous trees by fitting to the residual errors (gradients of a loss function). The final prediction is an additive sum: F(x) = Tree₁(x) + Tree₂(x) + ... + Treeₙ(x). L1 (Lasso) and L2 (Ridge) regularization penalties prevent overfitting. Learning rate (η) shrinks each tree\'s contribution. The result: a powerful model that continuously self-corrects and reaches near-optimal accuracy with fewer trees than Random Forest.',
      howUsed: 'Used as challenger model vs Random Forest. scale_pos_weight = churned_count / active_count (≈0.99) handled class imbalance natively without SMOTE. Early stopping after 50 non-improving rounds prevented overfitting. SHAP values were computed per customer to explain individual churn probability contributions.',
      inputFeatures: [
        { name: 'Days Since Last Order', type: 'Numerical', role: 'SHAP #1 — highest impact on churn' },
        { name: 'Order Frequency', type: 'Numerical', role: 'SHAP #2 — frequent orders = retention' },
        { name: 'Avg Spend (₹)', type: 'Numerical', role: 'Higher spend = engaged user' },
        { name: 'Delivery Complaints', type: 'Categorical', role: 'Direct negative experience signal' },
        { name: 'Promo Usage', type: 'Binary', role: 'Promo users may be deal-driven, churn risk' },
        { name: 'Rating Trend', type: 'Categorical', role: 'Declining ratings = increasing churn risk' },
        { name: 'City', type: 'Categorical (5)', role: 'City-specific churn patterns in dataset' },
        { name: 'Age Group', type: 'Categorical (3)', role: 'Youth/Adult/Senior churn differences' },
      ],
      targetOutput: { name: 'Churn Probability', values: ['P(Churn) → 0 = Active', 'P(Churn) → 1 = Churned'] },
      featureImportance: [
        { feature: 'Days Since Last Order', pct: 28, color: 'bg-orange-500' },
        { feature: 'Order Frequency', pct: 21, color: 'bg-orange-500' },
        { feature: 'Delivery Complaints', pct: 16, color: 'bg-orange-400' },
        { feature: 'Avg Spend (₹)', pct: 13, color: 'bg-orange-400' },
        { feature: 'Rating Trend', pct: 10, color: 'bg-orange-300' },
        { feature: 'Promo Usage', pct: 7, color: 'bg-orange-300' },
        { feature: 'City', pct: 3, color: 'bg-orange-200' },
        { feature: 'Age Group', pct: 2, color: 'bg-orange-200' },
      ],
      metrics: [
        { label: 'Accuracy', value: '91%', pct: 91 },
        { label: 'Precision', value: '90%', pct: 90 },
        { label: 'Recall',    value: '92%', pct: 92 },
        { label: 'F1 Score',  value: '91%', pct: 91 },
        { label: 'AUC-ROC',   value: '0.96', pct: 96 },
      ],
      steps: [
        'Label encoding for categorical features: city (5 cities), gender, payment method',
        'scale_pos_weight = 2984/3016 ≈ 0.99 to handle class imbalance natively',
        'Bayesian optimization: learning_rate=0.05, max_depth=6, subsample=0.8',
        'SHAP values computed for each of 6,000 customers to explain individual churn probability',
        'Cross-validation AUC-ROC (0.96) used as primary model selection metric',
      ],
      insight: '"Days Since Last Order" is the single most important feature per SHAP analysis — customers inactive for 45+ days showed 3.2× higher churn probability across the dataset.',
    },
  },
  {
    icon: Layers,
    name: 'Logistic Regression',
    accuracy: '85%',
    desc: 'Baseline binary classifier. Provides interpretable feature importance and probability scores.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    barColor: 'bg-purple-500',
    detail: {
      theory: 'Logistic Regression predicts churn probability using the sigmoid (logistic) function applied to a linear combination of input features. The equation is: P(Churn) = 1 / (1 + e^−(w₀ + w₁×OrderFreq + w₂×Rating + w₃×DaysSince + ...)). The sigmoid compresses any linear value into a 0–1 probability. The decision threshold (default 0.5) determines the final class: above threshold → Churned, below → Active. Each coefficient (weight) directly measures the direction and magnitude of each feature\'s effect on churn probability — making this model fully transparent and explainable to non-technical stakeholders.',
      howUsed: 'Served as the interpretable baseline model. L2 regularization (C=0.1) reduced overfitting. Classification threshold adjusted from 0.5 to 0.4 to improve recall on the churned class (catch more true churners). Feature coefficients revealed: a 1-unit increase in order frequency reduces churn probability by 0.18; a 1-unit drop in rating increases churn probability by 0.74.',
      inputFeatures: [
        { name: 'Order Frequency', type: 'Numerical', role: 'Coefficient: −0.18 (↑ orders = ↓ churn)' },
        { name: 'Avg Spend (₹)', type: 'Numerical (scaled)', role: 'Coefficient: −0.14 (↑ spend = ↓ churn)' },
        { name: 'Customer Rating', type: 'Numerical (1–5)', role: 'Coefficient: +0.74 (↓ rating = ↑ churn)' },
        { name: 'Loyalty Points', type: 'Numerical (scaled)', role: 'Coefficient: −0.11 (loyal = retained)' },
        { name: 'Delivery Issues', type: 'Binary (0/1)', role: 'Coefficient: +0.52 (complaint = churn risk)' },
        { name: 'Account Age (days)', type: 'Numerical (scaled)', role: 'Coefficient: −0.08 (older = more loyal)' },
      ],
      targetOutput: { name: 'P(Churn) via Sigmoid', values: ['< 0.4 threshold → Active', '≥ 0.4 threshold → Churned'] },
      featureImportance: [
        { feature: 'Customer Rating (↑ churn)', pct: 74, color: 'bg-destructive', coef: '+0.74', dir: '+' },
        { feature: 'Days Inactive (↑ churn)', pct: 68, color: 'bg-destructive', coef: '+0.68', dir: '+' },
        { feature: 'Delivery Issues (↑ churn)', pct: 52, color: 'bg-destructive', coef: '+0.52', dir: '+' },
        { feature: 'Order Frequency (↓ churn)', pct: 18, color: 'bg-purple-500', coef: '−0.18', dir: '-' },
        { feature: 'Avg Spend (↓ churn)', pct: 14, color: 'bg-purple-500', coef: '−0.14', dir: '-' },
        { feature: 'Loyalty Points (↓ churn)', pct: 11, color: 'bg-purple-500', coef: '−0.11', dir: '-' },
      ],
      metrics: [
        { label: 'Accuracy', value: '85%', pct: 85 },
        { label: 'Precision', value: '83%', pct: 83 },
        { label: 'Recall',    value: '86%', pct: 86 },
        { label: 'F1 Score',  value: '84%', pct: 84 },
        { label: 'AUC-ROC',   value: '0.91', pct: 91 },
      ],
      steps: [
        'Feature standardization with StandardScaler — critical for LR gradient convergence',
        'One-hot encoding for all categorical variables (city, payment method, gender)',
        'L2 regularization with C=0.1 tuned via 5-fold cross-validation grid search',
        'Decision threshold tuned to 0.4 to prioritize recall on churned class',
        'Coefficients extracted, ranked, and delivered as business stakeholder report',
      ],
      insight: 'Low rating (< 2.5 stars) had the strongest positive churn coefficient (+0.74), making it the single most actionable retention signal for the customer support team.',
    },
  },
  {
    icon: TreeDeciduous,
    name: 'Decision Tree',
    accuracy: '88%',
    desc: 'Highly interpretable model. Produces human-readable if-else rules to explain churn decisions.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    barColor: 'bg-emerald-500',
    detail: {
      theory: 'A Decision Tree recursively splits the dataset at each internal node by choosing the feature and split threshold that maximally reduces Gini Impurity — a measure of class mixing. Gini = 1 − Σ(pᵢ²). A pure node (all one class) has Gini = 0. The algorithm greedily selects the best split at every level until a stopping criterion (max_depth or min_samples_leaf) is met. Each leaf node outputs a class label. The resulting model is a hierarchy of if-else rules that can be read, printed, and explained by anyone without ML knowledge.',
      howUsed: 'Used to generate fully explainable churn rules for the business team. max_depth=8 was chosen to balance depth (accuracy) and readability. Cost-complexity pruning (ccp_alpha) removed weak branches. The most critical rule discovered — "Days Since Last Order > 45 AND Rating < 2.5 → 89% churn probability" — was directly integrated into the AI chatbot\'s retention trigger system.',
      inputFeatures: [
        { name: 'Days Since Last Order', type: 'Numerical', role: 'Root split — most discriminating feature' },
        { name: 'Customer Rating', type: 'Numerical (1–5)', role: '2nd split — sub-divides inactive users' },
        { name: 'Order Frequency', type: 'Numerical', role: '3rd level split — frequency confirms risk' },
        { name: 'Loyalty Points', type: 'Numerical', role: '4th level — high points = lower churn' },
        { name: 'Delivery Complaints', type: 'Binary', role: 'Leaf-level splitter for edge cases' },
      ],
      targetOutput: { name: 'Leaf Class Label', values: ['Active (0)', 'Churned (1)', '+ Gini purity score'] },
      featureImportance: [
        { feature: 'Days Since Last Order', pct: 35, color: 'bg-emerald-500' },
        { feature: 'Customer Rating', pct: 28, color: 'bg-emerald-500' },
        { feature: 'Order Frequency', pct: 20, color: 'bg-emerald-400' },
        { feature: 'Loyalty Points', pct: 10, color: 'bg-emerald-400' },
        { feature: 'Delivery Complaints', pct: 7, color: 'bg-emerald-300' },
      ],
      metrics: [
        { label: 'Accuracy', value: '88%', pct: 88 },
        { label: 'Precision', value: '87%', pct: 87 },
        { label: 'Recall',    value: '89%', pct: 89 },
        { label: 'F1 Score',  value: '88%', pct: 88 },
        { label: 'AUC-ROC',   value: '0.93', pct: 93 },
      ],
      steps: [
        'Gini impurity used as the node-split criterion (lower = purer splits)',
        'max_depth=8 and min_samples_leaf=20 set to control tree complexity',
        'cost_complexity_pruning (ccp_alpha=0.001) removed weak, low-gain branches',
        'Tree fully visualized using sklearn plot_tree and exported as PNG',
        'Top 5 churn decision rules extracted and integrated into AI chatbot trigger system',
      ],
      insight: 'The most powerful single rule: "Days Since Last Order > 45 AND Rating < 2.5" correctly identifies 89% of churned customers — used as the primary AI chatbot retention alert trigger.',
    },
  },
];

function StatCounter({ stat, delay, navigate }: {
  stat: typeof stats[0];
  delay: number;
  navigate: (path: string) => void;
}) {
  const { count, ref } = useCounter(stat.target);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      viewport={{ once: true }}
      className="text-center cursor-pointer group"
      onClick={() => navigate(stat.link)}
    >
      <div className="text-3xl md:text-4xl font-display font-bold text-primary-foreground group-hover:text-primary transition-colors">
        <span ref={ref}>{count.toLocaleString()}</span>{stat.suffix}
      </div>
      <div className="text-sm text-primary-foreground/60 mt-1 group-hover:text-primary-foreground/90 transition-colors">{stat.label}</div>
    </motion.div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<typeof mlModels[0] | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="container mx-auto flex items-center justify-between py-3 px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="Logo" className="h-10 w-10 rounded-lg" />
            <span className="font-display text-lg font-bold text-foreground">FoodRetain<span className="text-primary">AI</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Stats</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#contact-us" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Us</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
            <Button size="sm" onClick={() => navigate('/login?signup=true')}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
        </div>
        {/* Background gradient blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Predict. Retain. Grow.
              </div>
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-display font-bold mb-5 leading-tight">
                Turn Customer Data Into{' '}
                <span className="text-gradient">Retention</span>{' '}
                Intelligence
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
                FoodRetainAI identifies at-risk customers before they leave — using machine learning models trained on 6,000+ real behavioral records, paired with an AI chatbot that re-engages them automatically.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="gap-2 text-base px-6" onClick={() => navigate('/login')}>
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2 text-base" onClick={() => navigate('/dashboard')}>
                  <PlayCircle className="h-4 w-4" /> Explore Dashboard
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 bg-dark-gradient">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {stats.map((s, i) => (
              <StatCounter key={s.label} stat={s} delay={i * 0.1} navigate={navigate} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Everything You Need to Retain Customers</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">A complete intelligence platform — from data exploration to automated retention actions.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="group p-6 rounded-xl bg-card shadow-card hover:shadow-elevated transition-all duration-300 border border-border hover:border-primary/30 cursor-pointer"
                onClick={() => navigate(f.link)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">{f.badge}</span>
                </div>
                <h3 className="font-display font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRight className="h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ML Algorithms */}
      <section id="ml-models" className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Brain className="h-4 w-4" /> Machine Learning
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">ML Models Used</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Four classification algorithms were trained, tuned, and evaluated on 6,000+ real food delivery customer records.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {mlModels.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-elevated transition-all cursor-pointer"
                onClick={() => setSelectedModel(m)}
              >
                <div className={`h-12 w-12 rounded-xl ${m.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <m.icon className={`h-6 w-6 ${m.color}`} />
                </div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-display font-bold text-base">{m.name}</h3>
                  <span className={`text-sm font-bold ${m.color}`}>{m.accuracy}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                <div className="mt-4 w-full bg-muted rounded-full h-1.5">
                  <motion.div
                    className={`h-1.5 rounded-full ${m.barColor}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: m.accuracy }}
                    transition={{ duration: 1.2, delay: i * 0.1 + 0.3 }}
                    viewport={{ once: true }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-1 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View full details <ArrowRight className="h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button onClick={() => navigate('/dashboard')} className="gap-2">
              Try Live Churn Prediction <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">About FoodRetainAI</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                An intelligent, data-driven platform that empowers food-tech businesses to understand their customers, predict churn before it happens, and take action to retain them.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  title: 'Our Mission',
                  desc: 'To help food delivery businesses reduce customer churn by up to 40% using advanced machine learning models trained on real behavioral and transactional data.',
                },
                {
                  title: 'The Technology',
                  desc: 'Built on Random Forest, XGBoost, Logistic Regression, and Decision Tree models, combined with a Gemini-powered AI chatbot for real-time customer engagement.',
                },
                {
                  title: 'The Impact',
                  desc: 'From proactive discount offers to loyalty rewards and complaint resolution — FoodRetainAI turns data insights into customer retention actions automatically.',
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-xl bg-card border border-border"
                >
                  <h3 className="font-display font-semibold text-lg mb-3 text-primary">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Explore More */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <h3 className="font-display font-bold text-xl mb-6 text-center">Explore More</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Live Dashboard', desc: 'Metrics & analytics', href: '/dashboard', icon: BarChart3 },
                  { label: 'Churn Prediction', desc: 'Run ML predictions', href: '/dashboard', icon: Brain },
                  { label: 'AI Chatbot', desc: 'Customer retention bot', href: '/chatbot', icon: MessageSquare },
                  { label: 'Get Started', desc: 'Create your account', href: '/login?signup=true', icon: ArrowRight },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-dark-gradient">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-2xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
              Ready to Reduce Customer Churn?
            </h2>
            <p className="text-primary-foreground/70 mb-8 text-base">
              Access the full dashboard, run live ML predictions, and let the AI chatbot handle customer retention — completely free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold gap-2 px-8"
                onClick={() => navigate('/login?signup=true')}
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-primary-foreground hover:bg-white/10 gap-2"
                onClick={() => navigate('/dashboard')}
              >
                <BarChart3 className="h-4 w-4" /> View Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border pt-14 pb-6">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoImg} alt="Logo" className="h-9 w-9 rounded-lg" />
                <span className="font-display font-bold text-base">FoodRetain<span className="text-primary">AI</span></span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-Powered Customer Intelligence Platform for food delivery businesses.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Home', href: '/' },
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'AI Chatbot', href: '/chatbot' },
                  { label: 'Login / Sign Up', href: '/login' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link to={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div id="contact-us">
              <h4 className="font-semibold text-sm mb-4">Contact</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:biraj.aiml2526@gmail.com"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    biraj.aiml2526@gmail.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/ShahBiraj"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Github className="h-4 w-4 shrink-0" />
                    github.com/ShahBiraj
                  </a>
                </li>
                <li>
                  <a
                    href="https://linkedin.com/in/shah-biraj"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Linkedin className="h-4 w-4 shrink-0" />
                    linkedin.com/in/shah-biraj
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">© 2026 FoodRetainAI | AI-Powered Customer Intelligence Platform All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/ShahBiraj" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com/in/shah-biraj" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="mailto:biraj.aiml2526@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ML Model Detail Modal */}
      <AnimatePresence>
        {selectedModel && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedModel(null)}
          >
            <motion.div
              className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-6 border-b border-border flex items-start justify-between gap-4`}>
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl ${selectedModel.bg} flex items-center justify-center shrink-0`}>
                    <selectedModel.icon className={`h-7 w-7 ${selectedModel.color}`} />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold">{selectedModel.name}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{selectedModel.desc}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedModel(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors shrink-0">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-8">

                {/* ── 1. THEORY + FORMULA ── */}
                <div>
                  <h3 className={`font-display font-bold text-base mb-2 ${selectedModel.color}`}>How It Works — Theory</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedModel.detail.theory}</p>

                  {/* Algorithm-specific formula box */}
                  {selectedModel.name === 'Random Forest' && (
                    <div className="mt-4 bg-muted rounded-xl p-4 border border-border space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Core Prediction Rule (Majority Vote):</p>
                      <p className={`font-mono text-xs font-bold ${selectedModel.color}`}>ŷ = argmax_c Σᵢ 𝟙[Tᵢ(x) = c]  over i = 1…200 trees</p>
                      <p className="text-xs text-muted-foreground">Each Tᵢ is trained on a bootstrap sample (random rows) + √p random features per split (p = 8 features)</p>
                    </div>
                  )}
                  {selectedModel.name === 'XGBoost' && (
                    <div className="mt-4 bg-muted rounded-xl p-4 border border-border space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Additive Ensemble Formula:</p>
                      <p className={`font-mono text-xs font-bold ${selectedModel.color}`}>F(x) = η·T₁(x) + η·T₂(x) + ... + η·T₂₀₀(x)</p>
                      <p className="text-xs text-muted-foreground">η = learning rate (0.05) · Each Tᵢ fits the negative gradient (residual errors) of the previous trees</p>
                    </div>
                  )}
                  {selectedModel.name === 'Logistic Regression' && (
                    <div className="mt-4 bg-muted rounded-xl p-4 border border-border space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Core Equation — Sigmoid Function:</p>
                      <p className={`font-mono text-xs font-bold ${selectedModel.color}`}>P(Churn) = 1 / (1 + e<sup>−(w₀ + w₁·OrderFreq + w₂·Rating + w₃·DaysSince + w₄·LoyaltyPts + ...)</sup>)</p>
                      <p className="text-xs text-muted-foreground">Threshold tuned to 0.4 (not default 0.5) to maximise recall on churned class — catching more true churners</p>
                    </div>
                  )}
                  {selectedModel.name === 'Decision Tree' && (
                    <div className="mt-4 bg-muted rounded-xl p-4 border border-border space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Split Criterion — Gini Impurity:</p>
                      <p className={`font-mono text-xs font-bold ${selectedModel.color}`}>Gini(node) = 1 − [P(Active)² + P(Churned)²]</p>
                      <p className="text-xs text-muted-foreground">Best split = feature + threshold that minimises weighted Gini of child nodes. Pure node (all one class) = Gini 0.</p>
                    </div>
                  )}
                </div>

                {/* ── 2. ALGORITHM ARCHITECTURE VISUAL ── */}
                <div>
                  <h3 className={`font-display font-bold text-base mb-4 ${selectedModel.color}`}>Algorithm Architecture — Visual Diagram</h3>

                  {/* ── RANDOM FOREST ── */}
                  {selectedModel.name === 'Random Forest' && (
                    <div className="space-y-3">
                      <div className="bg-muted/50 rounded-xl p-4 border border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Step 1 — Training: Bagging (6,000 FoodPanda Records)</p>
                        <div className="flex items-start gap-2 flex-wrap">
                          <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-center shrink-0">
                            <Database className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="font-bold">6,000</p>
                            <p className="text-muted-foreground">Records</p>
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground mt-4 shrink-0" />
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-xs text-center shrink-0">
                            <p className="font-bold text-blue-500">SMOTE</p>
                            <p className="text-muted-foreground">Balance classes</p>
                            <p className="text-muted-foreground">3016 / 2984</p>
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground mt-4 shrink-0" />
                          <div className="flex gap-1.5 flex-wrap flex-1">
                            {['Bootstrap\nSample 1', 'Bootstrap\nSample 2', 'Bootstrap\nSample 3', '...200\nsamples'].map((s, i) => (
                              <div key={i} className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-center">
                                <GitBranch className={`h-3 w-3 mx-auto mb-0.5 ${selectedModel.color}`} />
                                <p className="text-muted-foreground whitespace-pre-line leading-tight">{s}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 italic">Each bootstrap sample = random 63% of rows (with replacement) + random √8 ≈ 3 features per split</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-4 border border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Step 2 — Prediction: Majority Voting (New Customer Input)</p>
                        <div className="flex items-start gap-2 flex-wrap">
                          <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-center shrink-0">
                            <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                            <p className="font-bold">Customer</p>
                            <p className="text-muted-foreground">Profile</p>
                          </div>
                          <ArrowRight className="h-3 w-3 mt-4 text-muted-foreground shrink-0" />
                          <div className="flex gap-1.5 flex-wrap flex-1">
                            {[{t:'T1',v:'Churned',c:'text-destructive bg-destructive/10'},{t:'T2',v:'Churned',c:'text-destructive bg-destructive/10'},{t:'T3',v:'Active',c:'text-success bg-success/10'},{t:'T4',v:'Churned',c:'text-destructive bg-destructive/10'},{t:'...',v:'...',c:'text-muted-foreground bg-muted'},{t:'T200',v:'Churned',c:'text-destructive bg-destructive/10'}].map((tree) => (
                              <div key={tree.t} className={`rounded-lg px-2 py-1.5 text-xs text-center border border-border ${tree.c}`}>
                                <p className="font-bold">{tree.t}</p>
                                <p className="text-xs">{tree.v}</p>
                              </div>
                            ))}
                          </div>
                          <ArrowRight className="h-3 w-3 mt-4 text-muted-foreground shrink-0" />
                          <div className="bg-destructive/10 border-2 border-destructive/40 rounded-lg px-3 py-2 text-xs text-center shrink-0">
                            <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-destructive" />
                            <p className="font-bold text-destructive">CHURNED</p>
                            <p className="text-muted-foreground">5/6 voted</p>
                            <p className="text-muted-foreground">Majority</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── XGBOOST ── */}
                  {selectedModel.name === 'XGBoost' && (
                    <div className="bg-muted/50 rounded-xl p-4 border border-border space-y-3">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Sequential Boosting — Each Tree Corrects Previous Tree's Errors</p>
                      <div className="space-y-2">
                        {[
                          {tree:'Tree 1',role:'Initial guess from data',err:'Large residual errors remain',pred:'~68% accuracy',final:false},
                          {tree:'Tree 2',role:'Fits residuals of Tree 1',err:'Errors reduce significantly',pred:'~78% accuracy',final:false},
                          {tree:'Tree 3',role:'Fits residuals of T1+T2',err:'Errors reduce further',pred:'~84% accuracy',final:false},
                          {tree:'... T200',role:'Final micro-corrections',err:'Errors minimised',pred:'91% accuracy ✓',final:true},
                        ].map((row, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="flex flex-col items-center shrink-0">
                              <div className="h-7 w-7 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-500">{i < 3 ? i+1 : 'N'}</div>
                              {i < 3 && <div className="w-px h-2 bg-border" />}
                            </div>
                            <div className="flex-1 bg-card border border-border rounded-lg p-2.5">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <p className="text-xs font-bold text-orange-500">{row.tree}</p>
                                  <p className="text-xs text-muted-foreground">{row.role}</p>
                                  {i < 3 && <p className="text-xs text-muted-foreground italic mt-0.5">↳ {row.err}</p>}
                                </div>
                                <span className={`text-xs shrink-0 px-2 py-0.5 rounded-full font-medium ${row.final ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{row.pred}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <p className="font-mono text-xs font-bold text-orange-500">Final: F(x) = 0.05·T₁ + 0.05·T₂ + ... + 0.05·T₂₀₀</p>
                        <p className="text-xs text-muted-foreground mt-1">Learning rate η=0.05 shrinks each tree's contribution — prevents any single tree from dominating</p>
                      </div>
                    </div>
                  )}

                  {/* ── LOGISTIC REGRESSION ── */}
                  {selectedModel.name === 'Logistic Regression' && (
                    <div className="bg-muted/50 rounded-xl p-4 border border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Feature Weights → Weighted Sum → Sigmoid Curve → Churn Probability</p>
                      <div className="flex items-start gap-3 flex-wrap">
                        <div className="flex-1 min-w-36 space-y-1">
                          <p className="text-xs font-semibold mb-2 text-muted-foreground">Input Feature × Weight</p>
                          {[
                            {f:'Rating (low)',w:'+0.74',c:'bg-destructive/10 text-destructive',dir:'↑ Churn'},
                            {f:'Days Inactive',w:'+0.68',c:'bg-destructive/10 text-destructive',dir:'↑ Churn'},
                            {f:'Delivery Issues',w:'+0.52',c:'bg-destructive/10 text-destructive',dir:'↑ Churn'},
                            {f:'Order Freq',w:'−0.18',c:'bg-success/10 text-success',dir:'↓ Churn'},
                            {f:'Avg Spend',w:'−0.14',c:'bg-success/10 text-success',dir:'↓ Churn'},
                            {f:'Loyalty Pts',w:'−0.11',c:'bg-success/10 text-success',dir:'↓ Churn'},
                          ].map((r) => (
                            <div key={r.f} className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs ${r.c}`}>
                              <span className="font-medium">{r.f}</span>
                              <span className="font-mono font-bold">{r.w} ({r.dir})</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col items-center justify-center pt-10 shrink-0">
                          <p className="text-xs text-muted-foreground font-mono mb-1">Σ wᵢxᵢ</p>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-28 bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-center shrink-0">
                          <p className="text-xs font-bold text-purple-500 mb-1">σ(z) Sigmoid</p>
                          <p className="text-xs font-mono text-purple-500">1/(1+e⁻ᶻ)</p>
                          <div className="flex items-end gap-0.5 h-10 mt-2 px-1">
                            {[2,5,10,20,40,70,85,92,96,98].map((v,i) => (
                              <motion.div key={i} className="flex-1 rounded-t bg-purple-500/60"
                                initial={{height:0}} animate={{height:`${v}%`}}
                                transition={{duration:0.5, delay:i*0.05}} />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">z → P(0–1)</p>
                        </div>
                        <div className="flex flex-col items-center justify-center pt-8 shrink-0">
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-2 pt-6 shrink-0">
                          <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 text-xs text-center">
                            <p className="font-bold text-destructive">P ≥ 0.4</p>
                            <p className="text-muted-foreground">→ CHURNED</p>
                          </div>
                          <div className="bg-success/10 border border-success/30 rounded-lg px-3 py-2 text-xs text-center">
                            <p className="font-bold text-success">P &lt; 0.4</p>
                            <p className="text-muted-foreground">→ ACTIVE</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── DECISION TREE ── */}
                  {selectedModel.name === 'Decision Tree' && (
                    <div className="bg-muted/50 rounded-xl p-4 border border-border overflow-x-auto">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Actual Decision Tree — Top Rules Extracted from Training on 6,000 Records</p>
                      <div className="min-w-[540px] space-y-0">
                        {/* Root */}
                        <div className="flex justify-center mb-0">
                          <div className="bg-emerald-500/10 border-2 border-emerald-500/50 rounded-xl px-4 py-2.5 text-xs text-center">
                            <p className="text-emerald-600 font-bold text-xs uppercase">ROOT NODE (Level 0)</p>
                            <p className="font-bold text-sm mt-0.5">Days Since Last Order &gt; 45?</p>
                            <p className="text-muted-foreground text-xs">Gini Gain: 0.38 — highest information gain of all 8 features</p>
                          </div>
                        </div>
                        {/* Connector from root */}
                        <div className="flex justify-center">
                          <div className="w-80 flex">
                            <div className="flex-1 border-b-2 border-l-2 border-border h-5 rounded-bl-lg" />
                            <div className="flex-1 border-b-2 border-r-2 border-border h-5 rounded-br-lg" />
                          </div>
                        </div>
                        {/* Level 1 labels */}
                        <div className="flex justify-between px-4 mb-1">
                          <span className="text-xs font-bold text-destructive">YES — Inactive &gt; 45 days</span>
                          <span className="text-xs font-bold text-success">NO — Active ≤ 45 days</span>
                        </div>
                        {/* Level 1 nodes */}
                        <div className="flex justify-between gap-4 mb-0">
                          <div className="flex-1 bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2 text-xs text-center">
                            <p className="font-bold text-destructive">Level 1 Split</p>
                            <p className="font-bold">Rating &lt; 2.5?</p>
                            <p className="text-muted-foreground">Gini Gain: 0.29</p>
                          </div>
                          <div className="flex-1 bg-success/10 border border-success/30 rounded-xl px-3 py-2 text-xs text-center">
                            <p className="font-bold text-success">Level 1 Split</p>
                            <p className="font-bold">Order Freq &gt; 15?</p>
                            <p className="text-muted-foreground">Gini Gain: 0.22</p>
                          </div>
                        </div>
                        {/* Connectors to leaves */}
                        <div className="flex justify-between gap-4">
                          <div className="flex-1 flex">
                            <div className="flex-1 border-b-2 border-l-2 border-border h-4 rounded-bl-lg" />
                            <div className="flex-1 border-b-2 border-r-2 border-border h-4 rounded-br-lg" />
                          </div>
                          <div className="flex-1 flex">
                            <div className="flex-1 border-b-2 border-l-2 border-border h-4 rounded-bl-lg" />
                            <div className="flex-1 border-b-2 border-r-2 border-border h-4 rounded-br-lg" />
                          </div>
                        </div>
                        {/* Leaf labels */}
                        <div className="flex justify-between gap-2 mb-1 text-xs font-bold px-1">
                          <span className="text-destructive">YES</span>
                          <span className="text-muted-foreground">NO</span>
                          <span className="text-success">YES</span>
                          <span className="text-muted-foreground">NO</span>
                        </div>
                        {/* Leaf nodes */}
                        <div className="flex justify-between gap-2">
                          <div className="flex-1 bg-destructive/15 border-2 border-destructive/50 rounded-xl p-2 text-center">
                            <p className="font-display font-bold text-destructive text-sm">CHURNED</p>
                            <p className="text-xs font-bold text-destructive mt-0.5">89% probability</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-tight">Days &gt; 45 AND Rating &lt; 2.5\n(Used as chatbot trigger!)</p>
                          </div>
                          <div className="flex-1 bg-success/10 border border-success/30 rounded-xl p-2 text-center">
                            <p className="font-display font-bold text-success text-sm">ACTIVE</p>
                            <p className="text-xs font-bold text-success mt-0.5">72% probability</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-tight">Inactive but still satisfied</p>
                          </div>
                          <div className="flex-1 bg-success/15 border-2 border-success/50 rounded-xl p-2 text-center">
                            <p className="font-display font-bold text-success text-sm">ACTIVE</p>
                            <p className="text-xs font-bold text-success mt-0.5">85% probability</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-tight">Recent + frequent = loyal</p>
                          </div>
                          <div className="flex-1 bg-destructive/10 border border-destructive/30 rounded-xl p-2 text-center">
                            <p className="font-display font-bold text-destructive text-sm">CHURNED</p>
                            <p className="text-xs font-bold text-destructive mt-0.5">61% probability</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-tight">Recent but low frequency</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── 3. HOW USED IN PROJECT ── */}
                <div>
                  <h3 className={`font-display font-bold text-base mb-2 ${selectedModel.color}`}>How It Was Used in This Project</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedModel.detail.howUsed}</p>
                </div>

                {/* ── 4. DATASET FEATURES → MODEL → OUTPUT FLOW ── */}
                <div>
                  <h3 className={`font-display font-bold text-base mb-4 ${selectedModel.color}`}>Dataset Input Features → {selectedModel.name} → Prediction Output</h3>
                  {/* Pipeline flow */}
                  <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-xl border border-border flex-wrap">
                    <div className="bg-card border border-border rounded-lg px-3 py-2 text-center shrink-0">
                      <p className="text-xs font-bold">{selectedModel.detail.inputFeatures.length} Features</p>
                      <p className="text-xs text-muted-foreground">Input</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className={`${selectedModel.bg} border border-current/20 rounded-lg px-3 py-2 text-center shrink-0`}>
                      <selectedModel.icon className={`h-5 w-5 mx-auto mb-0.5 ${selectedModel.color}`} />
                      <p className={`text-xs font-bold ${selectedModel.color}`}>{selectedModel.name}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="bg-card border border-border rounded-lg p-2 text-center shrink-0">
                      <p className="text-xs font-bold">{selectedModel.detail.targetOutput.name}</p>
                      {selectedModel.detail.targetOutput.values.map((v, i) => (
                        <p key={i} className={`text-xs ${i === 0 ? 'text-success' : 'text-destructive'}`}>{v}</p>
                      ))}
                    </div>
                  </div>
                  {/* Feature table */}
                  <div className="border border-border rounded-xl overflow-hidden">
                    <div className="grid grid-cols-3 bg-muted px-4 py-2">
                      <span className="text-xs font-bold text-muted-foreground">Feature (Column)</span>
                      <span className="text-xs font-bold text-muted-foreground">Data Type</span>
                      <span className="text-xs font-bold text-muted-foreground">Role / Impact in {selectedModel.name}</span>
                    </div>
                    {selectedModel.detail.inputFeatures.map((f, i) => (
                      <div key={f.name} className={`grid grid-cols-3 gap-0 px-4 py-2.5 text-xs border-t border-border ${i % 2 === 0 ? '' : 'bg-muted/30'}`}>
                        <span className="font-medium">{f.name}</span>
                        <span className="text-muted-foreground">{f.type}</span>
                        <span className={`${
                          f.role.includes('↑ churn') || f.role.includes('Churn risk') || f.role.includes('churn risk') || f.role.includes('complaint') || f.role.includes('Complaint') || f.role.includes('+0.') || f.role.includes('SHAP #1') || f.role.includes('negative') || f.role.includes('Direct negative') || f.role.includes('highest impact')
                            ? 'text-destructive'
                            : f.role.includes('↓ churn') || f.role.includes('retention') || f.role.includes('engaged') || f.role.includes('loyal') || f.role.includes('Loyal') || f.role.includes('↑ Orders') || f.role.includes('frequent') || f.role.includes('higher spend')
                            ? 'text-success'
                            : 'text-muted-foreground'
                        }`}>{f.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 5. FEATURE IMPORTANCE CHART ── */}
                <div>
                  <h3 className={`font-display font-bold text-base mb-1 ${selectedModel.color}`}>
                    {selectedModel.name === 'Logistic Regression' ? 'Feature Coefficients — Impact on Churn Probability' : 'Feature Importance Chart — Contribution to Model Decisions'}
                  </h3>
                  {selectedModel.name === 'Logistic Regression' && (
                    <p className="text-xs text-muted-foreground mb-3">Red = positive coefficient (increases P(Churn)). Green = negative coefficient (decreases P(Churn)).</p>
                  )}
                  {selectedModel.name !== 'Logistic Regression' && (
                    <p className="text-xs text-muted-foreground mb-3">Bar length = % of total model decisions driven by this feature across all trees.</p>
                  )}
                  <div className="space-y-2.5">
                    {selectedModel.detail.featureImportance.map((f, i) => (
                      <div key={f.feature} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground shrink-0 w-40 truncate" title={f.feature}>{f.feature}</span>
                        <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                          <motion.div
                            className={`h-3 rounded-full ${f.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${f.pct}%` }}
                            transition={{ duration: 0.85, delay: i * 0.07 }}
                          />
                        </div>
                        <span className="text-xs font-bold w-12 text-right">
                          {selectedModel.name === 'Logistic Regression' ? (f as any).coef ?? `${f.pct}%` : `${f.pct}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 6. PERFORMANCE METRICS ── */}
                <div>
                  <h3 className={`font-display font-bold text-base mb-3 ${selectedModel.color}`}>Performance Metrics — Evaluated on 1,200 Held-Out Test Records</h3>
                  <div className="space-y-2.5">
                    {selectedModel.detail.metrics.map((m) => (
                      <div key={m.label} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-20 shrink-0">{m.label}</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <motion.div
                            className={`h-2 rounded-full ${selectedModel.barColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${m.pct}%` }}
                            transition={{ duration: 0.9, delay: 0.1 }}
                          />
                        </div>
                        <span className={`text-sm font-bold w-10 text-right ${selectedModel.color}`}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 7. PIPELINE ── */}
                <div>
                  <h3 className={`font-display font-bold text-base mb-3 ${selectedModel.color}`}>Step-by-Step ML Pipeline</h3>
                  <ol className="space-y-2">
                    {selectedModel.detail.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className={`mt-0.5 h-5 w-5 rounded-full ${selectedModel.bg} ${selectedModel.color} text-xs font-bold flex items-center justify-center shrink-0`}>{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* ── 8. KEY INSIGHT ── */}
                <div className={`p-4 rounded-xl ${selectedModel.bg} border border-current/10`}>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className={`h-5 w-5 mt-0.5 shrink-0 ${selectedModel.color}`} />
                    <div>
                      <p className={`text-xs font-semibold mb-1 ${selectedModel.color}`}>Key Insight from This Dataset</p>
                      <p className="text-sm text-muted-foreground">{selectedModel.detail.insight}</p>
                    </div>
                  </div>
                </div>

                {/* ── CTA ── */}
                <div className="flex gap-3 pt-1">
                  <Button onClick={() => { setSelectedModel(null); navigate('/dashboard'); }} className="gap-2 flex-1">
                    Try Live Prediction <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedModel(null)}>Close</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
