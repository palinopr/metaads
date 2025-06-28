import Script from "next/script";
import Link from "next/link";
import "./landing.css";

export default function HomePage() {
  return (
    <>
      <div className="landing-page">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">Replace Your Agency with AI</h1>
            <p className="hero-subtitle">
              24/7 Meta Ads optimization that outperforms agencies at 90% less cost
            </p>
            <Link href="/auth/signup" className="cta-button">
              Start Free Trial
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            
            {/* Live Metrics Preview */}
            <div className="metrics-preview animate-on-scroll">
              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="metric-value" id="active-campaigns">0</span>
                  <span className="metric-label">Active Campaigns</span>
                  <span className="metric-change">↑ 12% this week</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value" id="total-spend">$0</span>
                  <span className="metric-label">Managed Spend</span>
                  <span className="metric-change">↑ 24% ROI</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value" id="avg-roas">0x</span>
                  <span className="metric-label">Average ROAS</span>
                  <span className="metric-change">↑ 0.8x increase</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value" id="total-conversions">0</span>
                  <span className="metric-label">Conversions</span>
                  <span className="metric-change">↑ 156% growth</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features" id="features">
          <div className="features-grid stagger-animation">
            <div className="feature-card animate-on-scroll">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI-Powered Optimization</h3>
              <p className="feature-description">
                Our AI analyzes millions of data points to optimize your campaigns 24/7, 
                making adjustments faster than any human could.
              </p>
            </div>
            
            <div className="feature-card animate-on-scroll">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Real-Time Analytics</h3>
              <p className="feature-description">
                Track performance metrics in real-time with our advanced dashboard. 
                See exactly how your campaigns are performing at any moment.
              </p>
            </div>
            
            <div className="feature-card animate-on-scroll">
              <div className="feature-icon">💰</div>
              <h3 className="feature-title">90% Cost Savings</h3>
              <p className="feature-description">
                Stop paying $5,000+/month for agency fees. Get better results with 
                our AI for just $299/month.
              </p>
            </div>
            
            <div className="feature-card animate-on-scroll">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Enterprise Security</h3>
              <p className="feature-description">
                Bank-level encryption and security. Your data and ad accounts are 
                protected with the highest security standards.
              </p>
            </div>
            
            <div className="feature-card animate-on-scroll">
              <div className="feature-icon">🚀</div>
              <h3 className="feature-title">Scale Instantly</h3>
              <p className="feature-description">
                Manage 10 or 10,000 campaigns with the same ease. Our platform 
                scales with your business automatically.
              </p>
            </div>
            
            <div className="feature-card animate-on-scroll">
              <div className="feature-icon">👥</div>
              <h3 className="feature-title">Team Collaboration</h3>
              <p className="feature-description">
                Invite your team and control who sees what. Set permissions at 
                the campaign level for complete control.
              </p>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="demo-section" id="demo">
          <div className="demo-container animate-on-scroll">
            <div className="demo-content">
              <h2>See MetaAds AI in Action</h2>
              <p>
                Watch how our AI optimizes campaigns in real-time, automatically 
                adjusting budgets, audiences, and creatives to maximize your ROI.
              </p>
              <ul style={{ marginTop: '2rem', lineHeight: '2' }}>
                <li>✓ Automatic bid optimization</li>
                <li>✓ Budget reallocation to winners</li>
                <li>✓ Creative fatigue detection</li>
                <li>✓ Audience expansion AI</li>
                <li>✓ Predictive performance modeling</li>
              </ul>
            </div>
            
            <div className="demo-dashboard">
              <h4 style={{ marginBottom: '1rem' }}>Campaign Performance</h4>
              <div className="demo-chart">
                <div className="chart-line"></div>
              </div>
              <div className="metrics-grid" style={{ marginTop: '2rem' }}>
                <div className="metric-card">
                  <span className="metric-value" data-value="4280" data-prefix="$" id="demo-spend">$0</span>
                  <span className="metric-label">Today&apos;s Spend</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value" data-value="5.2" data-decimals="1" data-suffix="x" id="demo-roas">0x</span>
                  <span className="metric-label">Current ROAS</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ padding: '6rem 2rem', textAlign: 'center', background: 'var(--card-bg)' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '2rem' }}>
            Ready to 10x Your Meta Ads?
          </h2>
          <p style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
            Join thousands of businesses using AI to dominate Meta Ads. 
            Start your free trial today.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/signup" className="cta-button">
              Start Free Trial
            </Link>
            <Link href="/auth/signin" className="cta-button" style={{ background: 'white', color: 'var(--primary)', border: '2px solid var(--primary)' }}>
              Sign In
            </Link>
          </div>
        </section>
      </div>
      
      <Script src="/landing.js" strategy="afterInteractive" />
    </>
  );
}