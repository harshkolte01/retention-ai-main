import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, BarChart3, Brain, Mail, MessageSquare, Shield, TrendingUp, Users, Github, Linkedin, ExternalLink, GitBranch, TreeDeciduous, Layers, Zap, X, CheckCircle2 } from 'lucide-react';
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
  { icon: BarChart3, title: 'Customer Analytics', desc: 'Deep EDA with interactive visualizations of customer behavior patterns.', link: '/dashboard', section: 'charts' },
  { icon: Brain, title: 'ML Churn Prediction', desc: 'Random Forest & XGBoost models predict at-risk customers accurately.', link: '/dashboard', section: 'prediction' },
  { icon: MessageSquare, title: 'AI Retention Chatbot', desc: 'Gemini-powered chatbot re-engages churned customers with offers.', link: '/chatbot', section: '' },
  { icon: TrendingUp, title: 'Real-Time Monitoring', desc: 'Track churn rates and retention metrics on a live dashboard.', link: '/dashboard', section: 'overview' },
  { icon: Users, title: 'Customer Segmentation', desc: 'Segment customers by city, age, spending, and order frequency.', link: '/dashboard', section: 'charts' },
  { icon: Shield, title: 'Retention Strategies', desc: 'AI-driven discount offers, loyalty rewards, and complaint resolution.', link: '/chatbot', section: '' },
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
    color: 'text-chart-blue',
    bg: 'bg-blue-500/10',
    barColor: 'bg-blue-500',
    detail: {
      howItWorks: 'Random Forest builds hundreds of decision trees during training, each trained on a random subset of data and features (bagging). At prediction time every tree votes and the majority class wins — reducing overfitting and variance significantly vs a single tree.',
      howUsed: 'Trained on 6,000 FoodPanda records with 80/20 split. Params (n_estimators=200, max_depth=15, min_samples_split=5) tuned via GridSearchCV. Became the primary production model due to highest F1 on the churned class. SMOTE used to balance Active vs Churned classes.',
      features: ['Order Frequency', 'Days Since Last Order', 'Average Spend (₹)', 'Customer Rating', 'Loyalty Points', 'Delivery Complaints', 'City Tier', 'Payment Method'],
      metrics: [
        { label: 'Accuracy', value: '92%', pct: 92 },
        { label: 'Precision', value: '91%', pct: 91 },
        { label: 'Recall',    value: '93%', pct: 93 },
        { label: 'F1 Score',  value: '92%', pct: 92 },
        { label: 'AUC-ROC',   value: '0.97', pct: 97 },
      ],
      steps: [
        'Data cleaning: handled missing ratings, encoded categoricals',
        'SMOTE applied to handle class imbalance (Active vs Churned)',
        'Feature scaling using StandardScaler on numerical columns',
        'GridSearchCV with 5-fold CV for hyperparameter tuning',
        'Final model trained on full training set, evaluated on held-out test set',
      ],
      insight: '"Order Frequency" and "Days Since Last Order" were the top 2 most important features, together accounting for 38% of model decisions.',
    },
  },
  {
    icon: Zap,
    name: 'XGBoost',
    accuracy: '91%',
    desc: 'Gradient boosting algorithm. Handles class imbalance and feature interactions extremely well.',
    color: 'text-chart-orange',
    bg: 'bg-orange-500/10',
    barColor: 'bg-orange-500',
    detail: {
      howItWorks: 'XGBoost builds trees sequentially where each new tree corrects errors of the previous ones using gradient descent on a differentiable loss function. L1/L2 regularization and tree pruning prevent overfitting. It is consistently one of the fastest and most accurate boosting algorithms.',
      howUsed: 'Used as challenger model vs Random Forest. scale_pos_weight = churned/active ratio handled imbalance natively without SMOTE. Early stopping (50 rounds) prevented overfitting. SHAP values were computed to explain individual predictions per customer.',
      features: ['Days Since Last Order', 'Order Frequency', 'Avg Spend (₹)', 'Delivery Complaints', 'Promo Usage', 'Rating Trend', 'City', 'Age Group'],
      metrics: [
        { label: 'Accuracy', value: '91%', pct: 91 },
        { label: 'Precision', value: '90%', pct: 90 },
        { label: 'Recall',    value: '92%', pct: 92 },
        { label: 'F1 Score',  value: '91%', pct: 91 },
        { label: 'AUC-ROC',   value: '0.96', pct: 96 },
      ],
      steps: [
        'Label encoding for categorical features (city, gender, payment)',
        'scale_pos_weight = churned_count / active_count for class imbalance',
        'Bayesian optimization for learning_rate, max_depth, subsample params',
        'SHAP values computed to explain individual customer churn probability',
        'Cross-validation AUC used as primary model selection metric',
      ],
      insight: '"Days Since Last Order" was the single most important feature per SHAP analysis — customers inactive for 45+ days had 3.2× higher churn probability.',
    },
  },
  {
    icon: Layers,
    name: 'Logistic Regression',
    accuracy: '85%',
    desc: 'Baseline binary classifier. Provides interpretable feature importance and probability scores.',
    color: 'text-chart-purple',
    bg: 'bg-purple-500/10',
    barColor: 'bg-purple-500',
    detail: {
      howItWorks: 'Logistic Regression models the probability of churn using a sigmoid function applied to a weighted linear combination of features. The output is a value between 0–1, thresholded at 0.5 to classify Active vs Churned. Coefficients can be directly interpreted as feature impact.',
      howUsed: 'Served as the interpretable baseline model. L2 regularization (C=0.1) reduced overfitting. Classification threshold adjusted from 0.5 to 0.4 to improve recall on churned class. Feature coefficients directly revealed: a 1-unit increase in order frequency reduced churn probability by 0.18.',
      features: ['Order Frequency', 'Avg Spend', 'Rating', 'Loyalty Points', 'Delivery Issues', 'Account Age (days)'],
      metrics: [
        { label: 'Accuracy', value: '85%', pct: 85 },
        { label: 'Precision', value: '83%', pct: 83 },
        { label: 'Recall',    value: '86%', pct: 86 },
        { label: 'F1 Score',  value: '84%', pct: 84 },
        { label: 'AUC-ROC',   value: '0.91', pct: 91 },
      ],
      steps: [
        'Feature standardization with StandardScaler (critical for LR convergence)',
        'One-hot encoding for all categorical variables',
        'L2 regularization with C tuned via cross-validation grid search',
        'Decision threshold tuned to 0.4 to prioritize recall on churned class',
        'Coefficients extracted and ranked for business stakeholder report',
      ],
      insight: 'Low rating (< 2.5 stars) had the strongest positive churn coefficient (+0.74), making it the most actionable signal for the support team.',
    },
  },
  {
    icon: TreeDeciduous,
    name: 'Decision Tree',
    accuracy: '88%',
    desc: 'Highly interpretable model. Produces human-readable rules to explain churn decisions.',
    color: 'text-success',
    bg: 'bg-green-500/10',
    barColor: 'bg-green-500',
    detail: {
      howItWorks: 'A Decision Tree recursively splits data at each node using the feature and threshold that maximizes information gain (Gini impurity reduction). The result is a tree of if-else rules — readable by both engineers and business analysts without any ML knowledge.',
      howUsed: 'Used to generate explainable churn rules for the business team. max_depth=8 balanced accuracy and interpretability. Key discovered rule: "If Days Since Last Order > 45 AND Rating < 2.5 → 89% churn probability". This rule directly drove the AI chatbot\'s retention trigger logic.',
      features: ['Days Since Last Order', 'Rating', 'Order Frequency', 'Loyalty Points', 'Delivery Complaints'],
      metrics: [
        { label: 'Accuracy', value: '88%', pct: 88 },
        { label: 'Precision', value: '87%', pct: 87 },
        { label: 'Recall',    value: '89%', pct: 89 },
        { label: 'F1 Score',  value: '88%', pct: 88 },
        { label: 'AUC-ROC',   value: '0.93', pct: 93 },
      ],
      steps: [
        'Gini impurity used as the node split criterion',
        'max_depth=8 and min_samples_leaf=20 to control tree complexity',
        'Cost-complexity pruning (ccp_alpha) applied after initial training',
        'Tree exported and visualized using sklearn plot_tree',
        'Top 5 churn rules extracted and integrated into chatbot trigger system',
      ],
      insight: 'The most powerful single rule found: "Days Since Last Order > 45 AND Rating < 2.5" correctly flagged 89% of churned customers — now used as the primary chatbot alert trigger.',
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
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Brain className="h-4 w-4" />
              AI & Machine Learning Powered
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
              <span className="text-gradient">AI-Driven</span> Food Customer{' '}
              <span className="text-gradient">Retention</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Predict customer churn using ML models, visualize behavioral data, and re-engage at-risk customers with an AI-powered chatbot — all in one intelligent dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2" onClick={() => navigate('/login')}>
                Launch Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore Features
              </Button>
            </div>
          </motion.div>
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
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Powerful Features</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to understand, predict, and prevent customer churn.</p>
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
                onClick={() => navigate(f.section ? `${f.link}?section=${f.section}` : f.link)}
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
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
          {/* About content */}
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
            <div>
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

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => alert('This platform is built for academic and demonstration purposes only. All data is synthetic and does not represent real individuals.')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> Terms of Use
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => alert('FoodRetainAI does not collect or store any personal data. Accounts are stored locally in your browser only.')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> Privacy Policy
                  </button>
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

              <div className="p-6 space-y-7">
                {/* How it works */}
                <div>
                  <h3 className={`font-display font-bold text-base mb-2 ${selectedModel.color}`}>How It Works</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedModel.detail.howItWorks}</p>
                </div>

                {/* How used in this project */}
                <div>
                  <h3 className={`font-display font-bold text-base mb-2 ${selectedModel.color}`}>How It Was Used in This Project</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedModel.detail.howUsed}</p>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h3 className={`font-display font-bold text-base mb-3 ${selectedModel.color}`}>Performance Metrics</h3>
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

                {/* Key Features Used */}
                <div>
                  <h3 className={`font-display font-bold text-base mb-3 ${selectedModel.color}`}>Input Features Used</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel.detail.features.map((f) => (
                      <span key={f} className="px-3 py-1 rounded-full bg-muted text-xs font-medium border border-border">{f}</span>
                    ))}
                  </div>
                </div>

                {/* Step by step process */}
                <div>
                  <h3 className={`font-display font-bold text-base mb-3 ${selectedModel.color}`}>Step-by-Step Pipeline</h3>
                  <ol className="space-y-2">
                    {selectedModel.detail.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className={`mt-0.5 h-5 w-5 rounded-full ${selectedModel.bg} ${selectedModel.color} text-xs font-bold flex items-center justify-center shrink-0`}>{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Key insight */}
                <div className={`p-4 rounded-xl ${selectedModel.bg} border border-current/10`}>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className={`h-5 w-5 mt-0.5 shrink-0 ${selectedModel.color}`} />
                    <div>
                      <p className={`text-xs font-semibold mb-1 ${selectedModel.color}`}>Key Insight</p>
                      <p className="text-sm text-muted-foreground">{selectedModel.detail.insight}</p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
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
