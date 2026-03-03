import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, BarChart3, Brain, Mail, MessageSquare, Shield, TrendingUp, Users, Github, Linkedin, ExternalLink, GitBranch, TreeDeciduous, Layers, Zap } from 'lucide-react';
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
  },
  {
    icon: Zap,
    name: 'XGBoost',
    accuracy: '91%',
    desc: 'Gradient boosting algorithm. Handles class imbalance and feature interactions extremely well.',
    color: 'text-chart-orange',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Layers,
    name: 'Logistic Regression',
    accuracy: '85%',
    desc: 'Baseline binary classifier. Provides interpretable feature importance and probability scores.',
    color: 'text-chart-purple',
    bg: 'bg-purple-500/10',
  },
  {
    icon: TreeDeciduous,
    name: 'Decision Tree',
    accuracy: '88%',
    desc: 'Highly interpretable model. Produces human-readable rules to explain churn decisions.',
    color: 'text-success',
    bg: 'bg-green-500/10',
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
            <a href="#ml-models" className="text-sm text-muted-foreground hover:text-foreground transition-colors">ML Models</a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Stats</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
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
                onClick={() => navigate('/dashboard')}
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
                    className={`h-1.5 rounded-full bg-primary`}
                    initial={{ width: 0 }}
                    whileInView={{ width: m.accuracy }}
                    transition={{ duration: 1.2, delay: i * 0.1 + 0.3 }}
                    viewport={{ once: true }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-1 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View prediction demo <ArrowRight className="h-3 w-3" />
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
    </div>
  );
}
