'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

const FEATURES = [
  {
    icon: '🛍️',
    title: 'Smart Shopping',
    desc: 'AI-powered product search across 125,000+ items on Kapruka',
    color: '#8b5cf6',
  },
  {
    icon: '🎁',
    title: 'Gift Genie',
    desc: 'Personalized gift recommendations for every occasion & budget',
    color: '#ec4899',
  },
  {
    icon: '🚚',
    title: 'Delivery Check',
    desc: 'Real-time delivery availability and cost across all of Sri Lanka',
    color: '#06b6d4',
  },
  {
    icon: '💳',
    title: 'Easy Checkout',
    desc: 'Seamless guest checkout with instant payment link generation',
    color: '#f59e0b',
  },
  {
    icon: '📦',
    title: 'Order Tracking',
    desc: 'Live order status and delivery timeline updates',
    color: '#10b981',
  },
  {
    icon: '🤖',
    title: 'Multi-Agent AI',
    desc: '5 specialized AI agents working together for the best experience',
    color: '#a78bfa',
  },
];

// Reliable high-quality Unsplash images for each product category
const SHOWCASE = [
  {
    img: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=600&q=80',
    title: 'Fresh Cakes',
    price: 'From LKR 3,500',
    tag: '🎂 Cakes',
    color: '#ec4899',
    desc: 'Same-day delivery island-wide',
    prompt: 'Show me birthday cakes for delivery',
  },
  {
    img: 'https://images.unsplash.com/photo-1487530811015-780b8d2e4f9f?w=600&q=80',
    title: 'Fresh Flowers',
    price: 'From LKR 2,500',
    tag: '🌹 Flowers',
    color: '#f43f5e',
    desc: 'Romantic bouquets & arrangements',
    prompt: 'Show me romantic flower bouquets',
  },
  {
    img: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&q=80',
    title: 'Premium Gifts',
    price: 'From LKR 1,200',
    tag: '🎁 Gifts',
    color: '#8b5cf6',
    desc: 'Curated gift sets & hampers',
    prompt: 'Find premium gift ideas under LKR 5000',
  },
  {
    img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
    title: 'Electronics',
    price: 'From LKR 15,000',
    tag: '📱 Tech',
    color: '#06b6d4',
    desc: 'Phones, laptops & accessories',
    prompt: 'Show trending electronics and gadgets',
  },
  {
    img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&q=80',
    title: 'Chocolates',
    price: 'From LKR 800',
    tag: '🍫 Chocolates',
    color: '#f59e0b',
    desc: 'Premium local & imported chocolates',
    prompt: 'Premium chocolate gift boxes',
  },
  {
    img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
    title: 'Jewellery',
    price: 'From LKR 5,000',
    tag: '💍 Jewellery',
    color: '#a78bfa',
    desc: 'Gold, silver & gemstone pieces',
    prompt: 'Show me jewellery gifts for women',
  },
];

const QUICK_PROMPTS = [
  '🎂 Find birthday cakes for delivery today',
  '🌹 Romantic flowers under LKR 5000',
  '📱 Latest smartphones under LKR 50,000',
  '🎁 Anniversary gifts for my girlfriend',
  '📦 Track my recent order',
  '🍫 Premium chocolates gift box',
];

// Chat demo using reliable images
const MOCK_CHAT_STEPS = [
  {
    user: 'Anniversary gifts under LKR 6000 for Colombo',
    bot: "Here are some lovely anniversary options delivered to Colombo today! 💕",
    products: [
      {
        id: 'demo-p1',
        title: 'Eternal Romance Bouquet',
        price: 4800,
        img: 'https://images.unsplash.com/photo-1487530811015-780b8d2e4f9f?w=300&q=80',
        tag: '🌹 Flowers',
      },
      {
        id: 'demo-p2',
        title: 'Premium Gift Hamper',
        price: 5500,
        img: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=300&q=80',
        tag: '🎁 Premium',
      },
    ],
  },
  {
    user: 'Send a birthday cake to Kandy',
    bot: "Great choice! 🎂 Here are fresh cakes we can deliver to Kandy:",
    products: [
      {
        id: 'demo-p3',
        title: 'Rich Chocolate Gateau',
        price: 4500,
        img: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=300&q=80',
        tag: '🎂 Fresh Cakes',
      },
      {
        id: 'demo-p4',
        title: 'Classic Vanilla Cake',
        price: 3800,
        img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80',
        tag: '🎂 Cakes',
      },
    ],
  },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [activePrompt, setActivePrompt] = useState(0);
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoStep, setDemoStep] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActivePrompt((p) => (p + 1) % QUICK_PROMPTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let subTimer;
    const mainInterval = setInterval(() => {
      setDemoStep(0);
      subTimer = setTimeout(() => {
        setDemoStep(1);
        subTimer = setTimeout(() => {
          setDemoStep(2);
          subTimer = setTimeout(() => {
            setDemoIndex((prev) => (prev + 1) % MOCK_CHAT_STEPS.length);
            setDemoStep(0);
          }, 5000);
        }, 1500);
      }, 2000);
    }, 10000);

    setDemoStep(0);
    subTimer = setTimeout(() => {
      setDemoStep(1);
      subTimer = setTimeout(() => { setDemoStep(2); }, 1500);
    }, 2000);

    return () => { clearInterval(mainInterval); clearTimeout(subTimer); };
  }, [mounted]);

  const activeDemo = MOCK_CHAT_STEPS[demoIndex];

  return (
    <main className={styles.main}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navLogo}>
          <div className={styles.logoImgWrap}>
            <img src="/logo.png" alt="Kapruka Genie Logo" className={styles.logoImg} />
          </div>
          <span className={styles.logoText}>
            <span className="gradient-text">Kapruka</span>{' '}
            <span className="gold-text">Genie</span>
          </span>
        </div>
        <div className={styles.navLinks}>
          <span className={`badge badge-green ${styles.liveBadge}`}>● Live</span>
          <span className="badge badge-violet">🇱🇰 Sri Lanka</span>
          <Link href="/chat" className="btn btn-primary btn-sm" id="nav-cta">
            Start Shopping ✨
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroLeft}>
            <div className={`${styles.heroBadge} animate-bounce-in`}>
              <span className={styles.heroBadgeDot} />
              Powered by Groq AI + Kapruka MCP
            </div>

            <h1 className={`${styles.heroTitle} ${mounted ? 'animate-fade-in' : ''}`}>
              Your AI Shopping{' '}
              <span className={styles.genieWordWrap}>
                <span className="gradient-text">Genie</span>
                <span className={styles.genieStar}>✨</span>
              </span>
              <span className={styles.heroSubHead}>for Sri Lanka</span>
            </h1>

            <p className={`${styles.heroSubtitle} ${mounted ? 'animate-fade-in' : ''}`}>
              Shop smarter across Kapruka's 125,000+ products. Get personalized gift
              recommendations, instant delivery checks, and seamless checkout — all through
              natural conversation.
            </p>

            <div className={styles.promptShowcase}>
              <span className={styles.promptIcon}>💬</span>
              <span className={styles.promptText} key={activePrompt}>
                {QUICK_PROMPTS[activePrompt]}
              </span>
            </div>

            <div className={`${styles.heroActions} ${mounted ? 'animate-slide-up' : ''}`}>
              <Link href="/chat" className="btn btn-primary btn-lg animate-glow" id="hero-cta">
                <img src="/logo.png" alt="" className={styles.heroBtnLogo} />
                Talk to Genie
              </Link>
              <a href="#features" className="btn btn-ghost btn-lg">
                Explore Features ↓
              </a>
            </div>

            <div className={styles.heroStats}>
              {[
                { value: '125K+', label: 'Products', icon: '🛍️' },
                { value: '5', label: 'AI Agents', icon: '🤖' },
                { value: '100+', label: 'Cities', icon: '🗺️' },
                { value: 'LKR', label: 'Currency', icon: '🇱🇰' },
              ].map((stat) => (
                <div key={stat.label} className={styles.stat}>
                  <div className={styles.statIcon}>{stat.icon}</div>
                  <div className={styles.statValue}>{stat.value}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Mockup */}
          <div className={styles.heroRight}>
            <div className={`${styles.chatMockup} animate-scale-in`}>
              <div className={styles.mockupHeader}>
                <div className={styles.mockupHeaderLeft}>
                  <div className={styles.mockupAvatarWrap}>
                    <img src="/logo.png" alt="Genie" className={styles.mockupAvatarImg} />
                    <span className={styles.mockupOnlineDot} />
                  </div>
                  <div>
                    <div className={styles.mockupTitle}>Kapruka Genie</div>
                    <div className={styles.mockupStatus}>
                      <span className={styles.mockupStatusDot} /> Online · Responding
                    </div>
                  </div>
                </div>
                <span className={styles.mockupBadge}>AI LIVE</span>
              </div>

              <div className={styles.mockupBody}>
                <div className={`${styles.mockMsgRow} ${styles.userMsgRow}`}>
                  <div className={styles.mockBubble}>{activeDemo.user}</div>
                </div>

                {demoStep >= 1 && (
                  <div className={`${styles.mockMsgRow} ${styles.botMsgRow} ${styles.animateFadeIn}`}>
                    <div className={styles.botAvatarMini}>
                      <img src="/logo.png" alt="Genie" className={styles.botAvatarImg} />
                    </div>
                    <div className={styles.mockBotBubble}>
                      {demoStep === 1 ? (
                        <div className="typing-indicator"><span /><span /><span /></div>
                      ) : (
                        <span>{activeDemo.bot}</span>
                      )}
                    </div>
                  </div>
                )}

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

              <div className={styles.mockupFooter}>
                <div className={styles.mockInput}>
                  <span>Ask Genie anything...</span>
                  <span className={styles.mockSendBtn}>↑</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Showcase ── */}
      <section className={styles.showcase}>
        <div className={styles.showcaseHeaderBlock}>
          <h2 className={styles.sectionTitle}>Shop Sri Lanka's Favorites</h2>
          <p className={styles.sectionSubtitle}>
            Real products from Kapruka — gifts, cakes, flowers, electronics &amp; more
          </p>
        </div>
        <div className={styles.showcaseGrid}>
          {SHOWCASE.map((item, i) => (
            <Link
              href={`/chat?q=${encodeURIComponent(item.prompt)}`}
              key={item.title}
              className={styles.showcaseCard}
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className={styles.showcaseImgWrap}>
                <img
                  src={item.img}
                  alt={item.title}
                  className={styles.showcaseImg}
                />
                <div className={styles.showcaseGradient} />
                <span className={styles.showcaseTag}>{item.tag}</span>
                <span className={styles.showcaseShopBtn}>Shop Now →</span>
              </div>
              <div className={styles.showcaseInfo}>
                <h3 className={styles.showcaseTitle}>{item.title}</h3>
                <p className={styles.showcaseDesc}>{item.desc}</p>
                <p className={styles.showcasePrice}>{item.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How Kapruka Genie Works</h2>
        <p className={styles.sectionSubtitle}>
          Three simple steps to a seamless Sri Lankan shopping experience
        </p>
        <div className={styles.stepsRow}>
          {[
            { step: '01', icon: '💬', title: 'Chat Naturally', desc: 'Tell Genie what you need — no forms, no filters, just conversation.' },
            { step: '02', icon: '🔍', title: 'AI Finds It', desc: '5 specialized agents search Kapruka\'s 125K+ products for the best match.' },
            { step: '03', icon: '🚀', title: 'Order & Track', desc: 'Checkout with a payment link and track delivery in real-time.' },
          ].map((s, i) => (
            <div key={s.step} className={styles.stepCard} style={{ animationDelay: `${i * 0.12}s` }}>
              <div className={styles.stepNum}>{s.step}</div>
              <div className={styles.stepIcon}>{s.icon}</div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
              {i < 2 && <div className={styles.stepConnector} />}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className={styles.features}>
        <h2 className={styles.sectionTitle}>Everything You Need to Shop Smarter</h2>
        <p className={styles.sectionSubtitle}>
          Five specialized AI agents working in harmony for the perfect Sri Lankan shopping experience
        </p>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={styles.featureCard}
              style={{ animationDelay: `${i * 0.08}s`, '--feature-color': f.color }}
            >
              <div className={styles.featureIconWrap} style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                <span className={styles.featureIcon}>{f.icon}</span>
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className={styles.socialProof}>
        <h2 className={styles.sectionTitle}>Loved by Sri Lankans</h2>
        <p className={styles.sectionSubtitle}>Real shoppers, real experiences across the island</p>
        <div className={styles.proofGrid}>
          {[
            { quote: 'Found the perfect anniversary gift in seconds! The AI understood exactly what I needed.', name: 'Asha P.', city: 'Colombo', emoji: '🌹' },
            { quote: 'Ordered a birthday cake and it arrived fresh in Kandy on the same day. Amazing!', name: 'Tharindu M.', city: 'Kandy', emoji: '🎂' },
            { quote: 'Tracking my order through chat is so convenient. Best Sri Lankan shopping experience!', name: 'Priya R.', city: 'Galle', emoji: '📦' },
          ].map((t, i) => (
            <div key={i} className={styles.proofCard} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={styles.proofEmoji}>{t.emoji}</div>
              <div className={styles.proofQuote}>"{t.quote}"</div>
              <div className={styles.proofAuthor}>
                <div className={styles.proofAvatar}>{t.name[0]}</div>
                <div>
                  <div className={styles.proofName}>{t.name}</div>
                  <div className={styles.proofCity}>📍 {t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaGlow} />
          <div className={styles.ctaLogoWrap}>
            <img src="/logo.png" alt="Kapruka Genie" className={styles.ctaLogo} />
          </div>
          <h2 className={styles.ctaTitle}>Ready to Shop the Smart Way?</h2>
          <p className={styles.ctaSubtitle}>
            Join thousands of Sri Lankans discovering products, sending gifts, and
            placing orders through Kapruka Genie.
          </p>
          <Link href="/chat" className="btn btn-primary btn-lg animate-glow" id="cta-bottom">
            <img src="/logo.png" alt="" className={styles.heroBtnLogo} />
            Start Your Journey ✨
          </Link>
          <p className={styles.ctaNote}>Free to use · No account needed · 125K+ products</p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <span className={styles.footerLogo}>
            <img src="/logo.png" alt="Kapruka Genie Logo" className={styles.footerLogoImg} />
            Kapruka Genie
          </span>
          <div className={styles.footerLinks}>
            <a href="https://kapruka.com" target="_blank" rel="noopener noreferrer">Kapruka.com</a>
            <span className={styles.footerDot}>·</span>
            <span>Powered by Groq AI</span>
            <span className={styles.footerDot}>·</span>
            <span>MCP Technology</span>
          </div>
          <span className={styles.footerFlag}>🇱🇰 Made for Sri Lanka</span>
        </div>
      </footer>
    </main>
  );
}
