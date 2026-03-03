import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, BarChart3, MessageSquare, Mail, Github, Linkedin, Sparkles, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoImg from '@/assets/logo.png';
import heroImg from '@/assets/hero-bg.jpg';
import { features, stats } from '@/data/homeData';
import StatCounter from '@/components/StatCounter';


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

      {/* About */
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

      /* CTA Banner */}
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

    </div>
  );
}
