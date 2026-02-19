'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/auth/status');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch('/auth/google');
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <main className="landing">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="150" height="150" rx="20" fill="#3F51B5"/>
              <path d="M45 45h60v60H45V45z" fill="none" stroke="white" strokeWidth="4"/>
              <path d="M45 75h60M75 45v60" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            </svg>
            <span>TeamCal</span>
          </div>
          
          <nav className="nav">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
          </nav>
          
          <div className="header-actions">
            {loading ? (
              <div className="spinner" />
            ) : isAuthenticated ? (
              <Link href="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <button onClick={handleGoogleLogin} className="btn btn-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Google Calendar's missing schedule view</h1>
          <p className="hero-subtitle">
            Enhance Google Calendar with team scheduling and planning functionalities. 
            Perfect for managing staff rotations, on-call duty times and team vacations.
          </p>
          <div className="hero-actions">
            <button onClick={handleGoogleLogin} className="btn btn-primary btn-lg">
              Get Started
            </button>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              Learn More
            </a>
          </div>
          <p className="hero-note">Free trial. No credit card required.</p>
        </div>
        <div className="hero-visual">
          <div className="schedule-preview">
            <div className="schedule-header">
              <span className="schedule-title">Team Schedule</span>
              <span className="schedule-date">February 2026</span>
            </div>
            <div className="schedule-grid">
              <div className="time-column">
                <div className="time-slot">9 AM</div>
                <div className="time-slot">10 AM</div>
                <div className="time-slot">11 AM</div>
                <div className="time-slot">12 PM</div>
                <div className="time-slot">1 PM</div>
                <div className="time-slot">2 PM</div>
                <div className="time-slot">3 PM</div>
                <div className="time-slot">4 PM</div>
                <div className="time-slot">5 PM</div>
              </div>
              <div className="team-member">
                <div className="member-name">Alice</div>
                <div className="event event-1"></div>
                <div className="event event-2"></div>
              </div>
              <div className="team-member">
                <div className="member-name">Bob</div>
                <div className="event event-3"></div>
              </div>
              <div className="team-member">
                <div className="member-name">Carol</div>
                <div className="event event-4"></div>
                <div className="event event-5"></div>
              </div>
              <div className="team-member">
                <div className="member-name">David</div>
                <div className="event event-6"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2>Everything you need for team scheduling</h2>
          <p className="section-subtitle">
            Powerful features to manage your team's time effectively
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                </svg>
              </div>
              <h3>Schedule View</h3>
              <p>
                View multiple team calendars side by side in a horizontal timeline. 
                See availability at a glance and identify scheduling gaps.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <h3>Google Integration</h3>
              <p>
                Seamlessly syncs with Google Calendar. All changes reflect immediately 
                and bidirectionally between TeamCal and Google.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <h3>Team Management</h3>
              <p>
                Create teams, add members, and manage permissions. 
                Share schedules with your entire organization.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              </div>
              <h3>Visual Analytics</h3>
              <p>
                Identify patterns and optimize coverage with visual insights 
                into your team's schedule and availability.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/>
                </svg>
              </div>
              <h3>Export & Share</h3>
              <p>
                Embed schedules in websites, export to PDF, or print for offline use. 
                Share planning results via email.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
                </svg>
              </div>
              <h3>Mobile Friendly</h3>
              <p>
                Access your schedules on the go with our responsive design. 
                Works on phones, tablets, and desktops.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          <p className="section-subtitle">
            Get started in minutes with simple integration
          </p>
          
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Connect Google Calendar</h3>
              <p>Sign in with your Google account and authorize TeamCal to access your calendars.</p>
            </div>
            
            <div className="step-connector"></div>
            
            <div className="step">
              <div className="step-number">2</div>
              <h3>Create Your Team</h3>
              <p>Add team members and select which calendars to include in your schedule view.</p>
            </div>
            
            <div className="step-connector"></div>
            
            <div className="step">
              <div className="step-number">3</div>
              <h3>Start Scheduling</h3>
              <p>Use the schedule view to plan shifts, manage rotations, and coordinate team availability.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to streamline your team scheduling?</h2>
          <p>Join thousands of teams using TeamCal to manage their schedules</p>
          <button onClick={handleGoogleLogin} className="btn btn-primary btn-lg">
            Start Free Trial
          </button>
          <p className="cta-note">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo">
                <svg width="24" height="24" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="150" height="150" rx="20" fill="#3F51B5"/>
                  <path d="M45 45h60v60H45V45z" fill="none" stroke="white" strokeWidth="4"/>
                  <path d="M45 75h60M75 45v60" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                </svg>
                <span>TeamCal</span>
              </div>
              <p>Google Calendar's missing schedule view</p>
            </div>
            
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#">Documentation</a>
              </div>
              
              <div className="footer-column">
                <h4>Company</h4>
                <a href="#">About</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
              </div>
              
              <div className="footer-column">
                <h4>Legal</h4>
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Security</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2026 TeamCal. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .landing {
          min-height: 100vh;
        }

        /* Header */
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border);
          z-index: 1000;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary);
        }

        .nav {
          display: flex;
          gap: 32px;
        }

        .nav a {
          color: var(--text-secondary);
          font-weight: 500;
          transition: color var(--transition-fast);
        }

        .nav a:hover {
          color: var(--primary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Hero */
        .hero {
          padding: 160px 24px 80px;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }

        .hero-content {
          animation: slideUp 0.6s ease-out;
        }

        .hero h1 {
          font-size: 3.5rem;
          line-height: 1.1;
          margin-bottom: 24px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .hero-note {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .hero-visual {
          animation: slideUp 0.6s ease-out 0.2s both;
        }

        .schedule-preview {
          background: var(--surface);
          border-radius: 16px;
          box-shadow: var(--shadow-elevated);
          overflow: hidden;
        }

        .schedule-header {
          padding: 16px 20px;
          background: var(--primary);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .schedule-title {
          font-weight: 600;
        }

        .schedule-date {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .schedule-grid {
          padding: 16px;
          display: grid;
          grid-template-columns: 60px repeat(4, 1fr);
          gap: 8px;
        }

        .time-slot {
          font-size: 0.75rem;
          color: var(--text-secondary);
          padding: 4px 0;
          text-align: right;
          font-family: var(--font-mono);
        }

        .team-member {
          position: relative;
        }

        .member-name {
          font-size: 0.875rem;
          font-weight: 500;
          padding: 4px 8px;
          background: var(--background);
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .event {
          position: absolute;
          left: 8px;
          right: 8px;
          height: 32px;
          border-radius: 4px;
          opacity: 0.9;
        }

        .event-1 { top: 40px; background: #4CAF50; }
        .event-2 { top: 80px; background: #2196F3; }
        .event-3 { top: 56px; background: #FF9800; }
        .event-4 { top: 24px; background: #9C27B0; }
        .event-5 { top: 88px; background: #E91E63; }
        .event-6 { top: 64px; background: #00BCD4; }

        /* Features */
        .features {
          padding: 80px 24px;
          background: var(--background);
        }

        .features h2 {
          text-align: center;
          margin-bottom: 16px;
        }

        .section-subtitle {
          text-align: center;
          color: var(--text-secondary);
          font-size: 1.125rem;
          margin-bottom: 48px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .feature-card {
          background: var(--surface);
          padding: 32px;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          transition: transform var(--transition-default), box-shadow var(--transition-default);
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-elevated);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: rgba(63, 81, 181, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          margin-bottom: 16px;
        }

        .feature-card h3 {
          margin-bottom: 12px;
          font-size: 1.125rem;
        }

        .feature-card p {
          color: var(--text-secondary);
          font-size: 0.9375rem;
          line-height: 1.6;
          margin: 0;
        }

        /* How It Works */
        .how-it-works {
          padding: 80px 24px;
          background: var(--schedule-view-bg);
        }

        .steps {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 16px;
          margin-top: 48px;
        }

        .step {
          text-align: center;
          max-width: 280px;
        }

        .step-number {
          width: 48px;
          height: 48px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.25rem;
          margin: 0 auto 16px;
        }

        .step h3 {
          margin-bottom: 8px;
        }

        .step p {
          color: var(--text-secondary);
          font-size: 0.9375rem;
          margin: 0;
        }

        .step-connector {
          width: 80px;
          height: 2px;
          background: var(--primary-light);
          margin-top: 24px;
        }

        /* CTA */
        .cta {
          padding: 80px 24px;
          background: var(--primary);
          text-align: center;
          color: white;
        }

        .cta h2 {
          color: white;
          margin-bottom: 16px;
        }

        .cta p {
          opacity: 0.9;
          font-size: 1.125rem;
          margin-bottom: 32px;
        }

        .cta .btn-primary {
          background: white;
          color: var(--primary);
        }

        .cta .btn-primary:hover {
          background: rgba(255, 255, 255, 0.9);
        }

        .cta-note {
          margin-top: 16px;
          font-size: 0.875rem;
          opacity: 0.8;
        }

        /* Footer */
        .footer {
          padding: 64px 24px 32px;
          background: var(--surface);
          border-top: 1px solid var(--border);
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          margin-bottom: 48px;
        }

        .footer-brand p {
          color: var(--text-secondary);
          margin-top: 8px;
        }

        .footer-links {
          display: flex;
          gap: 64px;
        }

        .footer-column h4 {
          margin-bottom: 16px;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
        }

        .footer-column a {
          display: block;
          color: var(--text-primary);
          margin-bottom: 8px;
          font-size: 0.9375rem;
        }

        .footer-column a:hover {
          color: var(--primary);
        }

        .footer-bottom {
          padding-top: 32px;
          border-top: 1px solid var(--border);
          text-align: center;
        }

        .footer-bottom p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .hero {
            grid-template-columns: 1fr;
            padding-top: 120px;
            text-align: center;
          }

          .hero-actions {
            justify-content: center;
          }

          .hero-visual {
            max-width: 600px;
            margin: 0 auto;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .steps {
            flex-direction: column;
            align-items: center;
          }

          .step-connector {
            width: 2px;
            height: 40px;
            margin: 0;
          }
        }

        @media (max-width: 768px) {
          .nav {
            display: none;
          }

          .hero h1 {
            font-size: 2.5rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .footer-content {
            flex-direction: column;
            gap: 32px;
          }

          .footer-links {
            flex-wrap: wrap;
            gap: 32px;
          }
        }
      `}</style>
    </main>
  );
}
