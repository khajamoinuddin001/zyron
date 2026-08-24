import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useBrandingStore } from '../store/branding.store';
import TenantLandingPage from './TenantLandingPage';
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
  ShieldCheck,
  Zap
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const domain = useBrandingStore(state => state.domain);
  const publicWebsite = useBrandingStore(state => state.publicWebsite);
  const isLoading = useBrandingStore(state => state.isLoading);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // If a custom tenant domain is active
  if (!isLoading && domain) {
    // If they explicitly disabled it, go to login. Otherwise, show the landing page.
    if (publicWebsite && publicWebsite.enabled === false) {
      return <Navigate to="/login" replace />;
    }
    return <TenantLandingPage />;
  }

  // Check if we are on an unknown subdomain that wasn't found in DB
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  let hasSubdomain = false;
  if (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'localhost') {
    hasSubdomain = true;
  } else if (parts.length > 2 && parts[0] !== 'www') {
    hasSubdomain = true;
  }

  // If ANY unknown subdomain is present, default to login to prevent showing main SaaS landing
  if (!isLoading && !domain && hasSubdomain) {
    return <Navigate to="/login" replace />;
  }

  const features = [
    { icon: <Users size={28} />, title: 'Attendance', desc: 'Real-time biometric & manual attendance tracking.', className: 'bento-large' },
    { icon: <MessageSquare size={28} />, title: 'Messaging', desc: 'Secure communication between staff, students & parents.', className: '' },
    { icon: <CreditCard size={28} />, title: 'Accounts & Fees', desc: 'Automated fee collection, invoicing, and payroll.', className: '' },
    { icon: <Calendar size={28} />, title: 'Examinations', desc: 'Generate report cards, hall tickets, and schedules.', className: 'bento-wide' },
    { icon: <BookOpen size={28} />, title: 'Library', desc: 'Complete library management with barcode support.', className: '' },
    { icon: <Truck size={28} />, title: 'Transport', desc: 'GPS tracking and route management for transport fleets.', className: '' },
    { icon: <Package size={28} />, title: 'Inventory', desc: 'Track assets, supplies, and orders automatically.', className: 'bento-wide' },
    { icon: <Home size={28} />, title: 'Hostel', desc: 'Manage room allocations, mess, and visitors easily.', className: '' }
  ];

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-container">
          <div className="logo">
            <div className="logo-icon"><ShieldCheck size={28} /></div>
            Edminz
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
          <div className="badge">
            <span className="badge-highlight">New</span> Edminz v2.0 is now live
          </div>
          <h1 className="hero-title">
            The Ultimate Business OS for <span className="text-gradient">Modern Organizations</span>
          </h1>
          <p className="hero-subtitle">
            Edminz unifies your attendance, messaging, accounts, and 12+ other applications into a single, beautiful SaaS platform. Say goodbye to scattered tools and embrace the future.
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
        <div className="section-header">
          <h2 className="section-title">One Platform, <span className="text-gradient">Endless Possibilities</span></h2>
          <p className="section-subtitle">
            Everything you need to run your institution or business, seamlessly integrated into a single unified workspace.
          </p>
        </div>

        <div className="bento-grid">
          {features.map((feature, idx) => (
            <div key={idx} className={`bento-item ${feature.className}`}>
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section container">
        <div className="cta-box glass-panel">
          <div className="cta-content">
            <h2 className="cta-title">Ready to transform your organization?</h2>
            <p className="section-subtitle" style={{ marginBottom: '2rem' }}>
              Join thousands of businesses that use Edminz to streamline their operations.
            </p>
            <button onClick={() => navigate('/register')} className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
              Get Started for Free <Zap size={20} style={{ marginLeft: '0.5rem' }} />
            </button>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border-light)', padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-darker)' }}>
        <div className="container">
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '1rem', color: 'var(--text-main)' }}>
            <div className="logo-icon"><ShieldCheck size={24} /></div>
            Edminz
          </div>
          <p>© 2026 Edminz SaaS Platform. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
