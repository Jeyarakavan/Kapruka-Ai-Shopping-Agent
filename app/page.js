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

const MOCK_CHAT_STEPS = [
  {
    user: "Anniversary gifts under LKR 6000 for Colombo",
    bot: "I've searched Kapruka's catalog. Here are some lovely anniversary options that can be delivered to Colombo today:",
    products: [
      {
        id: "demo-p1",
        title: "Eternal Romance Bouquet",
        price: 4800,
        img: "https://www.kapruka.com/shops/specialGifts/productImages/1740567890123_0001.jpg",
        tag: "🌹 Flowers",
      },
      {
        id: "demo-p2",
        title: "Kapruka Rich Chocolate Gateau",
        price: 5500,
        img: "https://www.kapruka.com/shops/specialGifts/productImages/1739784521450_0001.jpg",
        tag: "🎂 Fresh Cakes",
      }
    ]
  },
  {
    user: "Show trending tech items",
    bot: "Here are some of the most popular tech and electronic accessories currently available:",
    products: [
      {
        id: "demo-p3",
        title: "Premium Wireless Earbuds",
        price: 12500,
        img: "https://www.kapruka.com/shops/specialGifts/productImages/1739784521450_0002.jpg",
        tag: "📱 Tech",
      },
      {
        id: "demo-p4",
        title: "Smart fitness tracker band",
        price: 8900,
        img: "https://www.kapruka.com/shops/specialGifts/productImages/1756106966470_0001.jpg",
        tag: "⌚ Wearables",
      }
    ]
  }
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [activePrompt, setActivePrompt] = useState(0);
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoStep, setDemoStep] = useState(0); // 0: idle/user typing, 1: bot typing, 2: bot response loaded

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActivePrompt((p) => (p + 1) % QUICK_PROMPTS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let subTimer;
    
    // Cycle the demo animations
    const mainInterval = setInterval(() => {
      // Step 0: User types query (shows user bubble)
      setDemoStep(0);
      
      // Step 1: After 2 seconds, show Bot typing indicator
      subTimer = setTimeout(() => {
        setDemoStep(1);
        
        // Step 2: After 1.5 seconds, show Bot response & products
        subTimer = setTimeout(() => {
          setDemoStep(2);
          
          // Step 3: Stay on step 2 for 4.5 seconds, then move to next demo topic
          subTimer = setTimeout(() => {
            setDemoIndex((prev) => (prev + 1) % MOCK_CHAT_STEPS.length);
            setDemoStep(0);
          }, 4500);
        }, 1500);
      }, 2000);

    }, 10000); // Complete cycle is 10 seconds

    // Initial trigger
    setDemoStep(0);
    subTimer = setTimeout(() => {
      setDemoStep(1);
      subTimer = setTimeout(() => {
        setDemoStep(2);
      }, 1500);
    }, 2000);

    return () => {
      clearInterval(mainInterval);
      clearTimeout(subTimer);
    };
  }, [mounted]);

  const activeDemo = MOCK_CHAT_STEPS[demoIndex];

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
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroLeft}>
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

            {/* Animated prompt suggestion helper */}
            <div className={styles.promptShowcase}>
              <span className={styles.promptIcon}>💬</span>
              <span className={styles.promptText} key={activePrompt}>
                {QUICK_PROMPTS[activePrompt]}
              </span>
            </div>

            <div className={`${styles.heroActions} ${mounted ? 'animate-slide-up' : ''}`}>
              <Link href="/chat" className="btn btn-primary btn-lg animate-glow" id="hero-cta">
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
          </div>

          {/* Hero Right: Interactive Chat Preview Mockup */}
          <div className={styles.heroRight}>
            <div className={`${styles.chatMockup} animate-scale-in`}>
              {/* Header */}
              <div className={styles.mockupHeader}>
                <div className={styles.mockupHeaderLeft}>
                  <span className={styles.mockupAvatar}>🧞</span>
                  <div>
                    <div className={styles.mockupTitle}>Kapruka Genie</div>
                    <div className={styles.mockupStatus}>
                      <span className={styles.mockupStatusDot} /> Live Preview
                    </div>
                  </div>
                </div>
                <span className={styles.mockupBadge}>AI ASSISTANT</span>
              </div>

              {/* Chat Body */}
              <div className={styles.mockupBody}>
                {/* User message */}
                <div className={`${styles.mockMsgRow} ${styles.userMsgRow}`}>
                  <div className={styles.mockBubble}>
                    {activeDemo.user}
                  </div>
                </div>

                {/* Bot typing state or Bot text response */}
                {demoStep >= 1 && (
                  <div className={`${styles.mockMsgRow} ${styles.botMsgRow} ${styles.animateFadeIn}`}>
                    <span className={styles.botIcon}>🧞</span>
                    <div className={styles.mockBotBubble}>
                      {demoStep === 1 ? (
                        <div className="typing-indicator">
                          <span /><span /><span />
                        </div>
                      ) : (
                        <span>{activeDemo.bot}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Bot products loaded */}
                {demoStep === 2 && (
                  <div className={`${styles.mockProductsRow} ${styles.animateSlideUp}`}>
                    {activeDemo.products.map((p) => (
                      <div key={p.id} className={styles.mockProductCard}>
                        <div className={styles.mockProductImgWrap}>
                          <img src={p.img} alt={p.title} className={styles.mockProductImg} />
                          <span className={styles.mockProductTag}>{p.tag}</span>
                        </div>
                        <div className={styles.mockProductInfo}>
                          <div className={styles.mockProductTitle}>{p.title}</div>
                          <div className={styles.mockProductPrice}>LKR {p.price.toLocaleString('en-LK')}</div>
                          <div className={styles.mockProductActions}>
                            <button className={styles.mockBuyBtn} disabled>Buy</button>
                            <button className={styles.mockDetailBtn} disabled>Details</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input simulator */}
              <div className={styles.mockupFooter}>
                <div className={styles.mockInput}>
                  <span>Ask Genie anything...</span>
                  <span className={styles.mockSendIcon}>↑</span>
                </div>
              </div>
            </div>
          </div>
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
              style={{ animationDelay: `${i * 0.08}s` }}
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
              style={{ animationDelay: `${i * 0.08}s` }}
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
