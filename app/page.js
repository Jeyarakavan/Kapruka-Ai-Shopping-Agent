'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

const FEATURES = [
  {
    icon: '🛍️',
    title: 'Smart Shopping',
    desc: 'AI-powered product search across 125,000+ items on Kapruka',
  },
  {
    icon: '🎁',
    title: 'Gift Genie',
    desc: 'Personalized gift recommendations for every occasion & budget',
  },
  {
    icon: '🚚',
    title: 'Delivery Check',
    desc: 'Real-time delivery availability and cost across all of Sri Lanka',
  },
  {
    icon: '💳',
    title: 'Easy Checkout',
    desc: 'Seamless guest checkout with instant payment link generation',
  },
  {
    icon: '📦',
    title: 'Order Tracking',
    desc: 'Live order status and delivery timeline updates',
  },
  {
    icon: '🤖',
    title: 'Multi-Agent AI',
    desc: '5 specialized AI agents working together for the best experience',
  },
];

const SHOWCASE = [
  {
    img: 'https://www.kapruka.com/shops/specialGifts/productImages/1756106966470_0001.jpg',
    title: 'Premium Gifts',
    price: 'From LKR 1,200',
    tag: '🎁 Gifts',
  },
  {
    img: 'https://www.kapruka.com/shops/specialGifts/productImages/1739784521450_0001.jpg',
    title: 'Fresh Cakes',
    price: 'From LKR 3,500',
    tag: '🎂 Cakes',
  },
  {
    img: 'https://www.kapruka.com/shops/specialGifts/productImages/1740567890123_0001.jpg',
    title: 'Fresh Flowers',
    price: 'From LKR 2,500',
    tag: '🌹 Flowers',
    fallback: true,
  },
  {
    img: 'https://www.kapruka.com/shops/specialGifts/productImages/1739784521450_0002.jpg',
    title: 'Electronics',
    price: 'From LKR 15,000',
    tag: '📱 Tech',
  },
];

const QUICK_PROMPTS = [
  "Find birthday gifts under LKR 5000",
  "What cakes are available for delivery to Kandy?",
  "Show me trending electronics",
  "I need a wedding anniversary gift",
  "Track my order",
  "Best flowers for a romantic occasion",
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [activePrompt, setActivePrompt] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActivePrompt((p) => (p + 1) % QUICK_PROMPTS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className={styles.main}>
      {/* Background orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navLogo}>
          <span className={styles.genieEmoji}>🧞</span>
          <span className={styles.logoText}>
            <span className="gradient-text">Kapruka</span>{' '}
            <span className="gold-text">Genie</span>
          </span>
        </div>
        <div className={styles.navLinks}>
          <span className="badge badge-violet">🇱🇰 Sri Lanka</span>
          <Link href="/chat" className="btn btn-primary btn-sm">
            Start Shopping ✨
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={`${styles.heroBadge} animate-bounce-in`}>
          <span>🤖</span> Powered by Groq AI + Kapruka MCP
        </div>

        <h1 className={`${styles.heroTitle} ${mounted ? 'animate-fade-in' : ''}`}>
          Your AI Shopping<br />
          <span className="gradient-text">Genie</span> for Sri Lanka
          <span className={styles.genieStar}>✨</span>
        </h1>

        <p className={`${styles.heroSubtitle} ${mounted ? 'animate-fade-in' : ''}`}>
          Shop smarter across Kapruka's 125,000+ products. Get personalized gift
          recommendations, instant delivery checks, and seamless checkout — all through
          natural conversation.
        </p>

        {/* Animated prompt showcase */}
        <div className={styles.promptShowcase}>
          <span className={styles.promptIcon}>💬</span>
          <span className={styles.promptText} key={activePrompt}>
            {QUICK_PROMPTS[activePrompt]}
          </span>
        </div>

        <div className={`${styles.heroActions} ${mounted ? 'animate-slide-up' : ''}`}>
          <Link href="/chat" className="btn btn-primary btn-lg" id="hero-cta">
            🧞 Talk to Genie
          </Link>
          <a href="#features" className="btn btn-ghost btn-lg">
            See Features ↓
          </a>
        </div>

        {/* Stats */}
        <div className={styles.heroStats}>
          {[
            { value: '125K+', label: 'Products' },
            { value: '5', label: 'AI Agents' },
            { value: 'LKR', label: 'Currency' },
            { value: '🇱🇰', label: 'Sri Lanka' },
          ].map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Product Showcase */}
      <section className={styles.showcase}>
        <h2 className={styles.sectionTitle}>Shop Sri Lanka's Favorites</h2>
        <p className={styles.sectionSubtitle}>
          Real products from Kapruka — gifts, cakes, flowers, electronics &amp; more
        </p>
        <div className={styles.showcaseGrid}>
          {SHOWCASE.map((item, i) => (
            <Link
              href="/chat"
              key={item.title}
              className={styles.showcaseCard}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={styles.showcaseImgWrap}>
                <img
                  src={item.img}
                  alt={item.title}
                  className={styles.showcaseImg}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className={styles.showcaseFallback} style={{ display: 'none' }}>
                  <span>{item.tag.split(' ')[0]}</span>
                </div>
                <span className={styles.showcaseTag}>{item.tag}</span>
              </div>
              <div className={styles.showcaseInfo}>
                <h3>{item.title}</h3>
                <p>{item.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.features}>
        <h2 className={styles.sectionTitle}>
          Everything You Need to Shop Smarter
        </h2>
        <p className={styles.sectionSubtitle}>
          Five specialized AI agents working in harmony for the perfect Sri Lankan shopping experience
        </p>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={styles.featureCard}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaGlow} />
          <h2 className={styles.ctaTitle}>
            Ready to shop the smart way? 🧞‍♂️
          </h2>
          <p className={styles.ctaSubtitle}>
            Join thousands of Sri Lankans discovering products, sending gifts, and
            placing orders through Kapruka Genie.
          </p>
          <Link href="/chat" className="btn btn-gold btn-lg" id="cta-bottom">
            Start Your Journey ✨
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <span className={styles.footerLogo}>🧞 Kapruka Genie</span>
          <span className={styles.footerText}>
            Powered by{' '}
            <a href="https://kapruka.com" target="_blank" rel="noopener noreferrer">
              Kapruka.com
            </a>{' '}
            &amp; Groq AI
          </span>
          <span className={styles.footerFlag}>🇱🇰 Made for Sri Lanka</span>
        </div>
      </footer>
    </main>
  );
}
