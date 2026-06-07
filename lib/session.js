/**
 * Session Context Schema & Validation Helpers
 */

export function validateSessionContext(context = {}) {
  const clean = {
    giftContext: validateGiftContext(context.giftContext || {}),
    deliveryContext: validateDeliveryContext(context.deliveryContext || {}),
    checkoutData: validateCheckoutData(context.checkoutData || {}),
    trackingContext: validateTrackingContext(context.trackingContext || {}),
    cart: Array.isArray(context.cart)
      ? context.cart.slice(0, 10).map(validateCartItem).filter((i) => i.productId)
      : [],
    lastProducts: Array.isArray(context.lastProducts) ? context.lastProducts.slice(0, 12) : [],
    selectedProduct: validateSelectedProduct(context.selectedProduct),
    isConfirmation: typeof context.isConfirmation === 'boolean' ? context.isConfirmation : false,
    forceCheckout: typeof context.forceCheckout === 'boolean' ? context.forceCheckout : false,
    lang: typeof context.lang === 'string' ? context.lang : 'en',
  };

  return clean;
}

function validateGiftContext(ctx = {}) {
  let budget = ctx.budget;
  if (typeof budget === 'string') budget = parseInt(budget.replace(/,/g, ''), 10);
  if (typeof budget !== 'number' || isNaN(budget)) budget = undefined;

  return {
    occasion: typeof ctx.occasion === 'string' ? ctx.occasion : undefined,
    budget,
    recipientAge: typeof ctx.recipientAge === 'number' || typeof ctx.recipientAge === 'string' ? String(ctx.recipientAge) : undefined,
    relationship: typeof ctx.relationship === 'string' ? ctx.relationship : undefined,
    recipientGender: typeof ctx.recipientGender === 'string' ? ctx.recipientGender : undefined,
    yearsTogether: typeof ctx.yearsTogether === 'string' ? ctx.yearsTogether : undefined,
    interests: typeof ctx.interests === 'string' ? ctx.interests : undefined,
    active: typeof ctx.active === 'boolean' ? ctx.active : false,
  };
}

function validateCartItem(item = {}) {
  return {
    productId: String(item.productId || item.id || ''),
    title: String(item.title || item.name || 'Product'),
    price: typeof item.price === 'number' ? item.price : undefined,
    image: typeof item.image === 'string' ? item.image : undefined,
  };
}

function validateSelectedProduct(product) {
  if (!product || typeof product !== 'object') return undefined;
  const id = String(product.id || product.product_id || '');
  if (!id) return undefined;
  return {
    id,
    product_id: id,
    title: typeof product.title === 'string' ? product.title : product.name,
    name: typeof product.name === 'string' ? product.name : product.title,
    price: typeof product.price === 'number' ? product.price : undefined,
    image: typeof product.image === 'string' ? product.image : product.thumbnail,
    thumbnail: typeof product.thumbnail === 'string' ? product.thumbnail : product.image,
    url: typeof product.url === 'string' ? product.url : product.product_url,
    product_url: typeof product.product_url === 'string' ? product.product_url : product.url,
  };
}

function validateDeliveryContext(ctx = {}) {
  return {
    productId: typeof ctx.productId === 'string' || typeof ctx.productId === 'number' ? String(ctx.productId) : undefined,
    cityId: typeof ctx.cityId === 'string' || typeof ctx.cityId === 'number' ? String(ctx.cityId) : undefined,
    date: typeof ctx.date === 'string' ? ctx.date : undefined,
  };
}

function validateCheckoutData(data = {}) {
  return {
    productId: typeof data.productId === 'string' || typeof data.productId === 'number' ? String(data.productId) : undefined,
    recipientName: typeof data.recipientName === 'string' ? data.recipientName : undefined,
    recipientPhone: typeof data.recipientPhone === 'string' ? data.recipientPhone : undefined,
    deliveryAddress: typeof data.deliveryAddress === 'string' ? data.deliveryAddress : undefined,
    cityId: typeof data.cityId === 'string' || typeof data.cityId === 'number' ? String(data.cityId) : undefined,
    deliveryDate: typeof data.deliveryDate === 'string' ? data.deliveryDate : undefined,
    senderName: typeof data.senderName === 'string' ? data.senderName : undefined,
    giftMessage: typeof data.giftMessage === 'string' ? data.giftMessage : undefined,
    variantId: typeof data.variantId === 'string' || typeof data.variantId === 'number' ? String(data.variantId) : undefined,
    confirmed: typeof data.confirmed === 'boolean' ? data.confirmed : false,
  };
}

function validateTrackingContext(ctx = {}) {
  return {
    orderNumber: typeof ctx.orderNumber === 'string' || typeof ctx.orderNumber === 'number' ? String(ctx.orderNumber) : undefined,
  };
}
