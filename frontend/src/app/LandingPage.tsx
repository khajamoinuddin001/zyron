import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  CreditCard, 
  Calendar, 
  BookOpen, 
  Truck, 
  Package, 
  Home, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: <Users size={24} />, title: 'Attendance', desc: 'Real-time biometric & manual attendance tracking.' },
    { icon: <MessageSquare size={24} />, title: 'Messaging', desc: 'Secure communication between staff, students & parents.' },
    { icon: <CreditCard size={24} />, title: 'Accounts & Fees', desc: 'Automated fee collection, invoicing, and payroll.' },
    { icon: <Calendar size={24} />, title: 'Examinations', desc: 'Generate report cards, hall tickets, and schedules.' },
    { icon: <BookOpen size={24} />, title: 'Library', desc: 'Complete library management with barcode support.' },
    { icon: <Truck size={24} />, title: 'Transport', desc: 'GPS tracking and route management for transport fleets.' },
    { icon: <Package size={24} />, title: 'Inventory', desc: 'Track assets, supplies, and orders automatically.' },
    { icon: <Home size={24} />, title: 'Hostel', desc: 'Manage room allocations, mess, and visitors easily.' }
  ];

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-container">
          <div className="logo">
            <div className="logo-icon"><ShieldCheck size={28} /></div>
            Zyron
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>
          <div className="nav-actions">
            <button onClick={() => navigate('/login')} className="btn btn-outline" style={{ marginRight: '1rem' }}>Log In</button>
            <button onClick={() => navigate('/register')} className="btn btn-primary">Get Started</button>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-bg-glow"></div>
        <div className="container hero-content animate-float">
          <h1 className="hero-title">
            The Ultimate Business OS for <span className="text-gradient">Modern Organizations</span>
          </h1>
          <p className="hero-subtitle">
            Zyron unifies your attendance, messaging, accounts, and 12+ other applications into a single, beautiful SaaS platform. Say goodbye to scattered tools.
          </p>
          <div className="hero-cta">
            <button onClick={() => navigate('/register')} className="btn btn-primary">
              Start Free Trial <ArrowRight size={18} />
            </button>
            <button className="btn btn-outline">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      <section id="features" className="features-section container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>One Platform, <span className="text-gradient">Endless Possibilities</span></h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Everything you need to run your institution or business, seamlessly integrated.
          </p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card glass-panel">
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ marginTop: '5rem', borderTop: '1px solid var(--border-light)', padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="container">
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '1rem', color: 'var(--text-main)' }}>
            <div className="logo-icon"><ShieldCheck size={24} /></div>
            Zyron
          </div>
          <p>© 2026 Zyron SaaS Platform. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
