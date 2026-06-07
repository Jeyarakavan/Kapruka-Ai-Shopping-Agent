'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProductGrid from '@/components/ProductGrid';
import TrackingCard from '@/components/TrackingCard';
import OrderSummary from '@/components/OrderSummary';
import { translate, getTranslations } from '@/lib/i18n';
import styles from './chat.module.css';

const SUGGESTED_PROMPTS = [
  { icon: '🎂', text: 'Birthday cake delivery to Colombo' },
  { icon: '🌹', text: 'Romantic flowers for anniversary' },
  { icon: '📱', text: 'Latest smartphones under LKR 50,000' },
  { icon: '🎁', text: 'Corporate gift ideas for team' },
  { icon: '🍫', text: 'Premium chocolates gift box' },
  { icon: '📦', text: 'Track my order' },
];

const AGENT_LABELS = {
  shopping: { icon: '🛍️', label: 'Shopping Agent', color: '#7c3aed' },
  gift: { icon: '🎁', label: 'Gift Genie', color: '#ec4899' },
  delivery: { icon: '🚚', label: 'Delivery Agent', color: '#06b6d4' },
  checkout: { icon: '💳', label: 'Checkout Agent', color: '#f59e0b' },
  tracking: { icon: '📦', label: 'Tracking Agent', color: '#10b981' },
  general: { icon: '🧞', label: 'Kapruka Genie', color: '#8b5cf6' },
};

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'tanglish', label: 'Tanglish' },
];

export default function ChatPage() {
  const [lang, setLang] = useState('en');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: translate('welcomeMessage', 'en'),
      intent: 'general',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionContext, setSessionContext] = useState({});
  const [compareList, setCompareList] = useState([]);
  const [checkoutModal, setCheckoutModal] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const handleLangChange = useCallback((newLang) => {
    setLang(newLang);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === 'welcome'
          ? { ...m, content: translate('welcomeMessage', newLang) }
          : m
      )
    );
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text, options = {}) => {
      const trimmed = text?.trim() || input.trim();
      if (!trimmed || isLoading) return;

      setInput('');
      const userMsg = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const ctxForRequest = {
        ...sessionContext,
        ...options.sessionContext,
        lang,
        forceCheckout: options.forceCheckout || false,
      };

      // Build history for API (last 10 messages)
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const assistantMsgId = `assistant-${Date.now()}`;
      let streamedText = '';

      // Add empty assistant message for streaming
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          intent: options.forceCheckout ? 'checkout' : 'general',
          isStreaming: true,
          timestamp: new Date(),
        },
      ]);

      try {
        abortRef.current = new AbortController();
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history,
            sessionContext: ctxForRequest,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) throw new Error('Chat API failed');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'text' && parsed.chunk) {
                streamedText += parsed.chunk;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: streamedText }
                      : m
                  )
                );
              } else if (parsed.type === 'complete') {
                // Update session context — never reset chat
                setSessionContext((ctx) => ({
                  ...ctx,
                  ...(parsed.checkoutData ? { checkoutData: parsed.checkoutData } : {}),
                  ...(parsed.lastProducts ? { lastProducts: parsed.lastProducts } : {}),
                  ...(parsed.giftContext ? { giftContext: parsed.giftContext } : {}),
                  ...(parsed.cart ? { cart: parsed.cart } : {}),
                  forceCheckout: false,
                  isConfirmation: false,
                }));

                // Show checkout modal if order created
                if (parsed.order) {
                  setCheckoutModal({
                    order: parsed.order,
                    paymentUrl: parsed.paymentUrl,
                  });
                }

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: streamedText,
                          isStreaming: false,
                          intent: parsed.intent || 'general',
                          products: parsed.products,
                          tracking: parsed.tracking,
                          deliveryInfo: parsed.deliveryInfo,
                          cities: parsed.cities,
                          awaitingConfirmation: parsed.awaitingConfirmation,
                          order: parsed.order,
                          paymentUrl: parsed.paymentUrl,
                        }
                      : m
                  )
                );
              } else if (parsed.type === 'error') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: parsed.error || translate('errorConnecting', lang),
                          isStreaming: false,
                          intent: 'general',
                          isError: true,
                        }
                      : m
                  )
                );
              }
            } catch (err) {}
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: 'Connection error. Please check your internet and try again. 🌐',
                    isStreaming: false,
                    isError: true,
                  }
                : m
            )
          );
        }
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, isLoading, messages, sessionContext, lang]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleConfirmOrder = useCallback(() => {
    setSessionContext((ctx) => ({ ...ctx, isConfirmation: true }));
    sendMessage('Yes, please create this order and generate the payment link.');
  }, [sendMessage]);

  const t = (key) => translate(key, lang);

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.sidebarLogo}>
            <span>🧞</span>
            <span>
              <span className="gradient-text">Kapruka</span>{' '}
              <span className="gold-text">Genie</span>
            </span>
          </Link>
          <span className="badge badge-green">● Live</span>
        </div>

        {/* Language Selector in Sidebar */}
        <div className={styles.sidebarSection}>
          <p className={styles.sidebarLabel}>Language / භාෂාව / மொழி</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', padding: '0 4px' }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleLangChange(l.code)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: lang === l.code ? '1px solid var(--accent-violet)' : '1px solid var(--border-subtle)',
                  background: lang === l.code ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  color: lang === l.code ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.sidebarSection}>
          <p className={styles.sidebarLabel}>Quick Starts</p>
          <div className={styles.quickPrompts}>
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p.text}
                className={styles.quickPromptBtn}
                onClick={() => sendMessage(p.text)}
                disabled={isLoading}
                id={`quick-prompt-${p.text.slice(0, 20).replace(/\s/g, '-').toLowerCase()}`}
              >
                <span>{p.icon}</span>
                <span>{p.text}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.sidebarSection}>
          <p className={styles.sidebarLabel}>Agents</p>
          <div className={styles.agentList}>
            {Object.entries(AGENT_LABELS).map(([key, ag]) => (
              <div key={key} className={styles.agentItem}>
                <span>{ag.icon}</span>
                <span>{ag.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <span className={styles.footerBadge}>🇱🇰 Powered by Kapruka MCP</span>
        </div>
      </aside>

      {/* Main Chat */}
      <div className={styles.chatMain}>
        {/* Chat header */}
        <header className={styles.chatHeader}>
          <div className={styles.chatHeaderLeft}>
            <button
              className={styles.menuBtn}
              aria-label="Toggle menu"
              id="sidebar-toggle"
            >
              ☰
            </button>
            <div className={styles.genieAvatar}>🧞</div>
            <div>
              <div className={styles.genieTitle}>Kapruka Genie</div>
              <div className={styles.genieStatus}>
                <span className={styles.statusDot} />
                AI Shopping Assistant · Sri Lanka
              </div>
            </div>
          </div>
          <div className={styles.chatHeaderRight}>
            <span className="badge badge-violet">Groq AI</span>
          </div>
        </header>

        {/* Messages */}
        <div className={styles.messagesContainer} id="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.messageWrapper} ${
                msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper
              }`}
            >
              {msg.role === 'assistant' && (
                <div className={styles.agentTag}>
                  {AGENT_LABELS[msg.intent || 'general']?.icon}{' '}
                  {AGENT_LABELS[msg.intent || 'general']?.label}
                </div>
              )}

              <div
                className={`${styles.messageBubble} ${
                  msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                } ${msg.isError ? styles.errorBubble : ''}`}
              >
                {msg.isStreaming && !msg.content ? (
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                ) : (
                  <MessageContent content={msg.content} />
                )}
                {msg.isStreaming && msg.content && (
                  <span className={styles.cursor} />
                )}
              </div>

              {/* Product Grid */}
              {Array.isArray(msg.products) && msg.products.length > 0 && (
                <div className={styles.richContent}>
                  <ProductGrid
                    products={msg.products}
                    onBuyNow={(product) => {
                      const item = {
                        productId: product.id || product.product_id,
                        title: product.title || product.name,
                        price: product.price,
                        image: product.image || product.thumbnail,
                      };
                      const newCart = [...(sessionContext.cart || []), item].filter(
                        (c, i, arr) => arr.findIndex((x) => x.productId === c.productId) === i
                      );
                      setSessionContext((ctx) => ({
                        ...ctx,
                        cart: newCart,
                        lastProducts: msg.products,
                        giftContext: { ...ctx.giftContext, active: true },
                      }));
                      sendMessage(
                        `Added "${item.title}" to my cart (LKR ${(item.price || 0).toLocaleString('en-LK')}). Would you like to add more gifts or proceed to checkout?`,
                        { sessionContext: { cart: newCart, lastProducts: msg.products, giftContext: sessionContext.giftContext } }
                      );
                    }}
                    onGetDetails={(product) => {
                      sendMessage('Show details for this product', {
                        sessionContext: {
                          selectedProduct: product,
                          lastProducts: msg.products,
                          giftContext: sessionContext.giftContext,
                        },
                      });
                    }}
                    onCompare={(product, add) => {
                      setCompareList((prev) => {
                        if (!add) return prev.filter((p) => (p.id || p.product_id) !== (product.id || product.product_id));
                        if (prev.length >= 3) return prev;
                        if (prev.some((p) => (p.id || p.product_id) === (product.id || product.product_id))) return prev;
                        return [...prev, product];
                      });
                    }}
                  />
                </div>
              )}

              {/* Tracking Card */}
              {msg.tracking && (
                <div className={styles.richContent}>
                  <TrackingCard tracking={msg.tracking} orderNumber={msg.orderNumber} />
                </div>
              )}

              {/* Confirmation Button */}
              {msg.awaitingConfirmation && (
                <div className={styles.confirmBox}>
                  <p className={styles.confirmWarning}>
                    ⏰ {t('priceLockWarning')}
                  </p>
                  <button
                    className="btn btn-gold"
                    onClick={handleConfirmOrder}
                    disabled={isLoading}
                    id="confirm-order-btn"
                  >
                    ✅ Yes, Create My Order & Get Payment Link
                  </button>
                </div>
              )}

              {/* Payment URL */}
              {msg.paymentUrl && (
                <div className={styles.paymentCard}>
                  <div className={styles.paymentHeader}>🎉 Order Created!</div>
                  <p className={styles.paymentWarning}>
                    ⏰ {t('paymentWarning')}
                  </p>
                  <a
                    href={msg.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-gold"
                    id="payment-link"
                  >
                    💳 Complete Payment →
                  </a>
                </div>
              )}

              <div className={styles.messageTime}>
                {msg.timestamp?.toLocaleTimeString('en-LK', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Cart Tray */}
        {(sessionContext.cart?.length > 0) && (
          <div className={styles.cartTray}>
            <div className={styles.compareHeader}>
              <span>🛒 Cart ({sessionContext.cart.length} item{sessionContext.cart.length > 1 ? 's' : ''})</span>
              <button
                className={styles.compareClear}
                onClick={() => setSessionContext((ctx) => ({ ...ctx, cart: [] }))}
              >
                Clear
              </button>
            </div>
            <div className={styles.compareItems}>
              {sessionContext.cart.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className={styles.compareItem}>
                  {item.image && <img src={item.image} alt={item.title} className={styles.compareImg} />}
                  <div>
                    <div className={styles.compareName}>{item.title?.slice(0, 28)}</div>
                    <div className={styles.comparePrice}>LKR {(item.price || 0).toLocaleString('en-LK')}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="btn btn-gold btn-sm"
              onClick={() => {
                const item = sessionContext.cart[0];
                sendMessage('Proceed to checkout', {
                  forceCheckout: true,
                  sessionContext: {
                    checkoutData: { productId: item.productId, productTitle: item.title },
                    cart: sessionContext.cart,
                  },
                });
              }}
              disabled={isLoading}
            >
              Proceed to Checkout →
            </button>
          </div>
        )}

        {/* Compare Tray */}
        {compareList.length > 0 && (
          <div className={styles.compareTray}>
            <div className={styles.compareHeader}>
              <span>⇄ Comparing {compareList.length} product{compareList.length > 1 ? 's' : ''}</span>
              <button className={styles.compareClear} onClick={() => setCompareList([])}>Clear</button>
            </div>
            <div className={styles.compareItems}>
              {compareList.map((p) => (
                <div key={p.id || p.product_id} className={styles.compareItem}>
                  {p.image && <img src={p.image} alt={p.title} className={styles.compareImg} />}
                  <div>
                    <div className={styles.compareName}>{(p.title || p.name || '').slice(0, 30)}</div>
                    <div className={styles.comparePrice}>LKR {(p.price || 0).toLocaleString('en-LK')}</div>
                  </div>
                </div>
              ))}
            </div>
            {compareList.length >= 2 && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => sendMessage(`Compare these products: ${compareList.map((p) => p.title || p.name).join(' vs ')}`, {
                  sessionContext: { lastProducts: compareList },
                })}
                disabled={isLoading}
              >
                Compare Now
              </button>
            )}
          </div>
        )}

        {/* Input Bar */}
        <div className={styles.inputBar}>
          <div className={styles.inputWrapper}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('searchPlaceholder')}
              rows={1}
              disabled={isLoading}
              id="chat-input"
            />
            <button
              className={`${styles.sendBtn} ${isLoading ? styles.sendBtnLoading : ''}`}
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              id="send-btn"
              aria-label="Send message"
            >
              {isLoading ? (
                <span className={styles.spinner} />
              ) : (
                <span>↑</span>
              )}
            </button>
          </div>
          <p className={styles.inputHint}>
            Press Enter to send · Shift+Enter for new line · Powered by Kapruka MCP
          </p>
        </div>
      </div>

      {/* Order Modal */}
      {checkoutModal && (
        <OrderSummary
          order={checkoutModal.order}
          paymentUrl={checkoutModal.paymentUrl}
          onClose={() => setCheckoutModal(null)}
        />
      )}
    </div>
  );
}

// Markdown-like message renderer
function MessageContent({ content }) {
  if (!content) return null;

  // Convert basic markdown to styled output
  const lines = content.split('\n');
  return (
    <div className={styles.messageContent}>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <h3 key={i} className={styles.msgH3}>{renderInline(line.slice(4))}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className={styles.msgH2}>{renderInline(line.slice(3))}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={i} className={styles.msgH1}>{renderInline(line.slice(2))}</h1>;
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className={styles.msgListItem}>
              <span className={styles.msgBullet}>•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        if (line.trim() === '') {
          return <div key={i} className={styles.msgSpacer} />;
        }
        return <p key={i} className={styles.msgParagraph}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text) {
  // Handle **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className={styles.inlineCode}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
