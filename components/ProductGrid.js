'use client';

import ProductCard from './ProductCard';
import styles from './ProductGrid.module.css';

export default function ProductGrid({ products, onBuyNow, onGetDetails, onCompare }) {
  const list = Array.isArray(products) ? products : [];
  if (list.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.count}>{list.length} products found</span>
        <div className={styles.badge}>
          <span>🛍️</span> Kapruka Catalog
        </div>
      </div>
      <div className={styles.grid}>
        {list.map((product, index) => (
          <div
            key={`${product?.id || product?.product_id || 'p'}-${index}`}
            style={{ animationDelay: `${index * 0.06}s` }}
            className={styles.gridItem}
          >
            <ProductCard
              product={product}
              onBuyNow={onBuyNow}
              onGetDetails={onGetDetails}
              onCompare={onCompare}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
