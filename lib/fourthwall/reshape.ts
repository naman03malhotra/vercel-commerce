import { Cart, CartItem, Image, Money, Product, WooCommerceCart } from "lib/types";
import { FourthwallCartItem, FourthwallMoney, FourthwallProduct, FourthwallProductImage, FourthwallProductVariant } from "./types";

/**
 * Utils
 */
const DEFAULT_IMAGE: Image = {
  url: '',
  altText: '',
  width: 0,
  height: 0
}


const reshapeMoney = (money: FourthwallMoney): Money => {
  return {
    amount: money.value.toString(),
    currencyCode: money.currency
  };
}

/**
 * Products
 */
export const reshapeProducts = (products: FourthwallProduct[]) => {
  const reshapedProducts = [];

  for (const product of products) {
    if (product) {
      const reshapedProduct = reshapeProduct(product);

      if (reshapedProduct) {
        reshapedProducts.push(reshapedProduct);
      }
    }
  }

  return reshapedProducts;
};

export const reshapeProduct = (product: FourthwallProduct): Product => {
  if (!product) {
    return undefined;
  }

  return {
    id: product.id.toString(),
    handle: product.slug,
    title: product.name,
    descriptionHtml: product.description,
    description: product.short_description,
    images: product.images.map(img => ({
      url: img.src,
      altText: img.alt || product.name,
      width: 0,
      height: 0
    })),
    price: {
      amount: product.prices.price.toString(),
      currencyCode: 'USD'
    },
    featuredImage: product.images[0] ? {
      url: product.images[0].src,
      altText: product.images[0].alt || product.name,
      width: 0,
      height: 0
    } : DEFAULT_IMAGE,
    options: product.attributes.map(attr => ({
      id: attr.slug,
      name: attr.name,
      values: attr.options
    })),
    availableForSale: product.is_in_stock,
    tags: product.tags.map(tag => tag.name || ''),
    updatedAt: new Date().toISOString(),
  };
};

const reshapeImages = (images: FourthwallProductImage[], productTitle: string): Image[] => {
  return images.map((image) => {
    const filename = image.url.match(/.*\/(.*)\..*/)?.[1];
    return {
      ...image,
      altText: `${productTitle} - ${filename}`
    };
  });
};

const reshapeVariants = (variants: FourthwallProductVariant[]): ProductVariant[] => {
  return variants.map((v) => ({
    id: v.id,
    title: v.name,
    availableForSale: v.stock.type === 'UNLIMITED' || (v.stock.inStock || 0) > 0,
    images: reshapeImages(v.images, v.name),
    selectedOptions: [{
      name: 'Size',
      value: v.attributes.size?.name
    }, {
      name: 'Color',
      value: v.attributes.color?.name
    }],
    price: reshapeMoney(v.unitPrice),
  }))
}

/**
 * Cart
 */
const reshapeCartItem = (item: FourthwallCartItem): CartItem => {
  return {
    id: item.variant.id,
    quantity: item.quantity,
    cost: {
      totalAmount: reshapeMoney({
        value: (item.variant.unitPrice.value * item.quantity),
        currency: item.variant.unitPrice.currency
      })
    },
    merchandise: {
      id: item.variant.id,
      title: item.variant.name,
      // TODO: Stubbed out
      selectedOptions: [],
      product: {
        // TODO: need this product info in model
        id: item.variant.product?.id || 'TT', 
        handle: item.variant.product?.slug || 'TT',
        title: item.variant.product?.name || 'TT',
        featuredImage: {
          url: item.variant.images[0]?.url || 'TT',
          altText: item.variant.product?.name || 'TT',
          width: item.variant.images[0]?.width || 100,
          height: item.variant.images[0]?.height || 100
        }
      }
    }
  };
}

export const reshapeCart = (cart: WooCommerceCart): Cart => {
  return {
    cost: {
      totalAmount: {
        amount: (cart.totals.total_price / Math.pow(10, cart.totals.currency_minor_unit)).toString(),
        currencyCode: cart.totals.currency_code,
      },
      subtotalAmount: {
        amount: (cart.totals.total_items / Math.pow(10, cart.totals.currency_minor_unit)).toString(),
        currencyCode: cart.totals.currency_code,
      },
    },
    lines: cart.items.map(item => ({
      id: item.key,
      quantity: item.quantity,
      cost: {
        totalAmount: {
          amount: (item.totals.line_total / Math.pow(10, item.totals.currency_minor_unit)).toString(),
          currencyCode: item.totals.currency_code
        }
      },
      merchandise: {
        id: item.product_id.toString(),
        title: item.name,
        selectedOptions: [],
        product: {
          id: item.product_id.toString(),
          handle: item.sku,
          title: item.name,
          featuredImage: item.images[0] ? {
            url: item.images[0].src,
            altText: item.images[0].alt || item.name,
            width: 0,
            height: 0
          } : DEFAULT_IMAGE
        }
      }
    })),
    currency: cart.totals.currency_code,
    totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0)
  };
};
