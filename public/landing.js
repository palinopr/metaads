// MetaAds Landing Page - SEOGrove Style Implementation

const MetaAdsLanding = {
  // Initialize all modules
  init() {
    this.setupScrollAnimations();
    this.animateHeroMetrics();
    this.setupInteractiveElements();
    this.initDemoChart();
    this.setupSmoothScroll();
  },

  // Scroll-based animations
  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // Handle staggered animations
          if (entry.target.classList.contains('stagger-animation')) {
            const children = entry.target.children;
            Array.from(children).forEach((child, index) => {
              child.style.setProperty('--index', index);
              setTimeout(() => {
                child.classList.add('visible');
              }, index * 100);
            });
          }
          
          // Trigger metric animations
          if (entry.target.classList.contains('metrics-preview')) {
            this.animateMetrics();
          }
        }
      });
    }, observerOptions);

    // Observe all animated elements
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  },

  // Animate hero section metrics
  animateHeroMetrics() {
    const metrics = [
      { id: 'active-campaigns', value: 2847, duration: 2000 },
      { id: 'total-spend', value: 384750, prefix: '$', duration: 2500 },
      { id: 'avg-roas', value: 4.2, decimals: 1, suffix: 'x', duration: 2000 },
      { id: 'total-conversions', value: 12483, duration: 2200 }
    ];

    // Wait for page load
    setTimeout(() => {
      metrics.forEach(metric => {
        this.animateValue(metric);
      });
    }, 500);
  },

  // Animate numeric values
  animateValue({ id, value, prefix = '', suffix = '', decimals = 0, duration = 2000 }) {
    const element = document.getElementById(id);
    if (!element) return;

    const startTime = performance.now();
    const startValue = 0;
    const endValue = value;

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      const currentValue = startValue + (endValue - startValue) * easeOutExpo;
      
      // Format and display value
      const formattedValue = decimals > 0 
        ? currentValue.toFixed(decimals) 
        : Math.floor(currentValue).toLocaleString();
      
      element.textContent = prefix + formattedValue + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // Add pulse effect on completion
        element.parentElement.classList.add('pulse');
        setTimeout(() => {
          element.parentElement.classList.remove('pulse');
        }, 600);
      }
    };

    requestAnimationFrame(update);
  },

  // Animate dashboard metrics
  animateMetrics() {
    const metrics = document.querySelectorAll('.metric-value');
    metrics.forEach((metric, index) => {
      const value = parseInt(metric.getAttribute('data-value') || '0');
      const prefix = metric.getAttribute('data-prefix') || '';
      const suffix = metric.getAttribute('data-suffix') || '';
      const decimals = parseInt(metric.getAttribute('data-decimals') || '0');
      
      setTimeout(() => {
        this.animateValue({
          id: metric.id,
          value,
          prefix,
          suffix,
          decimals,
          duration: 1500
        });
      }, index * 200);
    });
  },

  // Interactive elements
  setupInteractiveElements() {
    // CTA button ripple effect
    document.querySelectorAll('.cta-button').forEach(button => {
      button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
      });
    });

    // Metric card hover effects
    document.querySelectorAll('.metric-card').forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.02)';
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
      });
    });

    // Feature cards parallax on mouse move
    const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards.length > 0) {
      document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        
        featureCards.forEach((card, index) => {
          const speed = (index + 1) * 0.5;
          card.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
        });
      });
    }
  },

  // Initialize demo chart animation
  initDemoChart() {
    const chart = document.querySelector('.demo-chart');
    if (!chart) return;

    // Create animated bars
    const data = [40, 65, 80, 95, 120, 145, 170, 190, 210, 230, 250, 280];
    const chartBars = document.createElement('div');
    chartBars.className = 'chart-bars';
    
    data.forEach((value, index) => {
      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      bar.style.height = '0%';
      bar.style.left = `${(index / data.length) * 100}%`;
      
      // Animate bar height
      setTimeout(() => {
        bar.style.height = `${(value / 300) * 100}%`;
      }, 1000 + index * 100);
      
      chartBars.appendChild(bar);
    });
    
    chart.appendChild(chartBars);

    // Add real-time update simulation
    setInterval(() => {
      const randomBar = Math.floor(Math.random() * data.length);
      const bars = chart.querySelectorAll('.chart-bar');
      const currentHeight = parseFloat(bars[randomBar].style.height);
      const variation = (Math.random() - 0.5) * 10;
      const newHeight = Math.max(10, Math.min(90, currentHeight + variation));
      bars[randomBar].style.height = `${newHeight}%`;
    }, 2000);
  },

  // Smooth scroll navigation
  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          const offset = 80; // Header height
          const targetPosition = target.offsetTop - offset;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  },

  // Utility: Check if element is in viewport
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MetaAdsLanding.init());
} else {
  MetaAdsLanding.init();
}

// Additional styles for ripple effect
const style = document.createElement('style');
style.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .chart-bars {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    padding: 0 20px;
  }
  
  .chart-bar {
    width: 20px;
    background: linear-gradient(to top, #0066FF, #00D4FF);
    border-radius: 4px 4px 0 0;
    transition: height 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
  }
  
  .pulse {
    animation: pulse 0.6s ease-out;
  }
`;
document.head.appendChild(style);