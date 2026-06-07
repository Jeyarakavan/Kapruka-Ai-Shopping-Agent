'use client';

import styles from './TrackingCard.module.css';

const STATUS_COLORS = {
  delivered: '#10b981',
  'out for delivery': '#06b6d4',
  processing: '#f59e0b',
  shipped: '#7c3aed',
  cancelled: '#ef4444',
  pending: '#94a3b8',
};

const STATUS_ICONS = {
  delivered: '✅',
  'out for delivery': '🚚',
  processing: '⚙️',
  shipped: '📦',
  cancelled: '❌',
  pending: '🕐',
};

function getStatusColor(status) {
  if (!status) return '#94a3b8';
  const lower = status.toLowerCase();
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return '#94a3b8';
}

function getStatusIcon(status) {
  if (!status) return '📦';
  const lower = status.toLowerCase();
  for (const [key, icon] of Object.entries(STATUS_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '📦';
}

export default function TrackingCard({ tracking, orderNumber }) {
  if (!tracking) return null;

  const status = tracking.status || tracking.order_status || 'Unknown';
  const statusColor = getStatusColor(status);
  const statusIcon = getStatusIcon(status);

  const timeline = tracking.timeline || tracking.history || tracking.events || [];
  const recipient = tracking.recipient_name || tracking.recipient;
  const deliveryDate = tracking.estimated_delivery || tracking.delivery_date;
  const currentLocation = tracking.current_location || tracking.location;

  return (
    <div className={styles.card} id={`tracking-card-${orderNumber || 'order'}`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.orderNum}>Order #{orderNumber || tracking.order_number}</div>
          <div
            className={styles.status}
            style={{ color: statusColor }}
          >
            {statusIcon} {status}
          </div>
        </div>
        <div
          className={styles.statusDot}
          style={{ background: statusColor, boxShadow: `0 0 12px ${statusColor}` }}
        />
      </div>

      {/* Details */}
      <div className={styles.details}>
        {recipient && (
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Recipient</span>
            <span className={styles.detailValue}>{recipient}</span>
          </div>
        )}
        {deliveryDate && (
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Est. Delivery</span>
            <span className={styles.detailValue}>{deliveryDate}</span>
          </div>
        )}
        {currentLocation && (
          <div className={styles.detail}>
            <span className={styles.detailLabel}>Location</span>
            <span className={styles.detailValue}>📍 {currentLocation}</span>
          </div>
        )}
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className={styles.timeline}>
          <div className={styles.timelineTitle}>Delivery Timeline</div>
          {timeline.map((event, i) => (
            <div key={i} className={`${styles.timelineItem} ${i === 0 ? styles.active : ''}`}>
              <div className={styles.timelineDot} style={i === 0 ? { background: statusColor } : {}} />
              <div className={styles.timelineContent}>
                <div className={styles.timelineEvent}>
                  {event.status || event.event || event.description}
                </div>
                {(event.timestamp || event.date || event.time) && (
                  <div className={styles.timelineTime}>
                    {event.timestamp || event.date || event.time}
                  </div>
                )}
                {event.location && (
                  <div className={styles.timelineLocation}>📍 {event.location}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
