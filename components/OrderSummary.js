'use client';

import { useEffect } from 'react';
import styles from './OrderSummary.module.css';

export default function OrderSummary({ order, paymentUrl, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!order) return null;

  const orderNumber = order.order_number || order.id || order.order_id;
  const totalAmount = order.total || order.total_amount || order.amount;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} id="order-summary-modal">
        <button className={styles.closeBtn} onClick={onClose} id="close-order-modal">✕</button>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.successIcon}>🎉</div>
          <h2 className={styles.title}>Order Confirmed!</h2>
          <p className={styles.subtitle}>Your order has been successfully created</p>
        </div>

        {/* Price Lock Warning */}
        <div className={styles.priceLock}>
          <span>⏰</span>
          <span>
            <strong>60-Minute Price Lock Active</strong>
            <br />
            Prices are reserved for 60 minutes. Complete payment before expiration.
          </span>
        </div>

        {/* Order Details */}
        <div className={styles.details}>
          {orderNumber && (
            <div className={styles.detailRow}>
              <span>Order Number</span>
              <span className={styles.orderNum}>#{orderNumber}</span>
            </div>
          )}
          {totalAmount && (
            <div className={styles.detailRow}>
              <span>Total Amount</span>
              <span className={styles.price}>LKR {Number(totalAmount).toLocaleString('en-LK')}</span>
            </div>
          )}
          {order.recipient_name && (
            <div className={styles.detailRow}>
              <span>Recipient</span>
              <span>{order.recipient_name}</span>
            </div>
          )}
          {order.delivery_date && (
            <div className={styles.detailRow}>
              <span>Delivery Date</span>
              <span>{order.delivery_date}</span>
            </div>
          )}
        </div>

        {/* Payment Button */}
        {paymentUrl ? (
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-gold btn-lg ${styles.payBtn}`}
            id="payment-btn"
          >
            💳 Complete Payment Now
          </a>
        ) : (
          <div className={styles.noPayment}>
            Payment link will be sent to your email shortly.
          </div>
        )}

        <button className={`btn btn-ghost ${styles.closeTextBtn}`} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
