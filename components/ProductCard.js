'use client';

import { useState } from 'react';
import styles from './ProductCard.module.css';

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%230f1521'/%3E%3Ctext x='50%25' y='50%25' font-size='60' text-anchor='middle' dominant-baseline='middle'%3E🛍️%3C/text%3E%3C/svg%3E";

function formatPrice(price, currency = 'LKR') {
  if (!price) return 'Price N/A';
  const num = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
  if (isNaN(num)) return price;
  return `${currency} ${num.toLocaleString('en-LK')}`;
}

export default function ProductCard({ product, onBuyNow, onGetDetails, onCompare }) {
  const [imgError, setImgError] = useState(false);
  const [isCompared, setIsCompared] = useState(false);

  const title = product?.title || product?.name || 'Product';
  const price = product?.price || product?.selling_price;
  const originalPrice = product?.original_price || product?.compare_at_price;
  const image = imgError ? PLACEHOLDER_IMG : (product?.image || product?.thumbnail || product?.images?.[0] || PLACEHOLDER_IMG);
  const inStock = product?.in_stock !== false && product?.stock !== 0;
  const deliveryEst = product?.delivery_estimate || product?.delivery_days;
  const discount = originalPrice && price
    ? Math.round((1 - price / originalPrice) * 100)
    : null;

  const productId = product?.id || product?.product_id;
  const productUrl = product?.url || product?.product_url;

  return (
    <div className={styles.card} id={`product-card-${productId}`}>
      {/* Image */}
      <div className={styles.imageWrapper}>
        <img
          src={image}
          alt={title}
          className={styles.image}
          onError={() => setImgError(true)}
          loading="lazy"
        />
        {discount && discount > 0 && (
          <div className={styles.discountBadge}>-{discount}%</div>
        )}
        {!inStock && (
          <div className={styles.outOfStockOverlay}>Out of Stock</div>
        )}
        <div className={styles.imageOverlay}>
          <button
            className={styles.quickViewBtn}
            onClick={() => onGetDetails?.(product)}
            id={`view-details-${productId}`}
          >
            👁 View Details
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.title} title={title}>
          {title.length > 50 ? title.slice(0, 47) + '…' : title}
        </h3>

        {/* Price */}
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatPrice(price)}</span>
          {originalPrice && originalPrice > price && (
            <span className={styles.originalPrice}>{formatPrice(originalPrice)}</span>
          )}
        </div>

        {/* Meta */}
        <div className={styles.meta}>
          <span className={`${styles.stockBadge} ${inStock ? styles.inStock : styles.outOfStock}`}>
            {inStock ? '✓ In Stock' : '✗ Out of Stock'}
          </span>
          {deliveryEst && (
            <span className={styles.delivery}>
              🚚 {typeof deliveryEst === 'number' ? `${deliveryEst} days` : deliveryEst}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${styles.buyBtn}`}
            onClick={() => onBuyNow?.(product)}
            disabled={!inStock}
            id={`buy-now-${productId}`}
          >
            Buy Now
          </button>
          <button
            className={`${styles.actionBtn} ${styles.compareBtn} ${isCompared ? styles.compared : ''}`}
            onClick={() => {
              setIsCompared(!isCompared);
              onCompare?.(product, !isCompared);
            }}
            id={`compare-${productId}`}
          >
            {isCompared ? '✓' : '⇄'} Compare
          </button>
        </div>

        {productUrl && (
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.kaprukLink}
            id={`kapruka-link-${productId}`}
          >
            View on Kapruka →
          </a>
        )}
      </div>
    </div>
  );
}
