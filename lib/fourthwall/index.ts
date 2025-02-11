import { Cart, Product, WooCommerceCart } from "lib/types";
import * as path from 'path';
import { reshapeCart, reshapeProduct, reshapeProducts } from "./reshape";
import { FourthwallProduct } from "./types";

const API_URL = process.env.SERVER_URL || '';
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || '';

if (!API_URL || !SERVICE_TOKEN) {
  throw new Error('Missing required environment variables: SERVER_URL or SERVICE_TOKEN');
}

const ENDPOINTS = {
  PRODUCTS: 'products',
  CART: {
    GET: 'cart',
    ADD_ITEM: 'cart/add-item',
    UPDATE_ITEM: 'cart/update-item',
    DELETE_ITEM: 'cart/delete-item',
    CLEAR: 'cart/clear',
    CHECKOUT: 'checkout',
  },
  ORDER: 'order',
  SETTINGS: 'settings',
};

let csrfToken = '';

/**
 * Helpers
 */
async function fourthwallGet<T>(url: string, query: Record<string, string | number | undefined>, options: RequestInit = {}): Promise<{ status: number; body: T }> {
  const constructedUrl = new URL(url);
  // add query parameters
  Object.keys(query).forEach((key) => {
    if (query[key] !== undefined) {
      constructedUrl.searchParams.append(key, query[key].toString());
    }
  });
  constructedUrl.searchParams.append('key', SERVICE_TOKEN);

  // Log current CSRF token before making request
  console.warn('GET - Current CSRF Token:', csrfToken);

  try {
    const result = await fetch(
      constructedUrl.toString(),
      {
        method: 'GET',
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-WB-Client-Site': 'mylocalsite',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
          ...options.headers
        },
      }
    );

    const newToken = result.headers.get('X-CSRF-Token');
    // Log new token from response
    console.warn('GET - New CSRF Token:', newToken);

    if (newToken) {
      csrfToken = newToken;
    }

    const body = await result.json();

    if (result.status !== 200) {
      console.error({
        status: result.status,
        url: constructedUrl.toString(),
        body,
      });

      throw new Error("Failed to fetch from Fourthwall");
    }

    return {
      status: result.status,
      body,
    };
  } catch (e) {
    throw {
      error: e,
      url
    };
  }
}

async function fourthwallPost<T>(url: string, data: any, options: RequestInit = {}): Promise<{ status: number; body: T }> {
  try {
    // Log current CSRF token before making request
    console.warn('POST - Current CSRF Token:', csrfToken);

    const headers = {
      'Content-Type': 'application/json',
      'X-WB-Client-Site': 'mylocalsite',
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      ...options.headers
    };

    console.warn('POST - Headers:', headers);

    const result = await fetch(`${url}?key=${SERVICE_TOKEN}`, {
      method: 'POST',
      ...options,
      headers,
      body: JSON.stringify(data)
    });

    const newToken = result.headers.get('X-CSRF-Token');
    // Log new token from response
    console.warn('POST - New CSRF Token:', newToken);
    
    if (newToken) {
      csrfToken = newToken;
    }

    console.warn('POST', url, data);

    const bodyRaw = await result.text();
    console.warn('POST', bodyRaw);
    const body = JSON.parse(bodyRaw);

    return {
      status: result.status,
      body
    };
  } catch (e) {
    throw {
      error: e,
      url,
      data
    };
  }
}

/**
 * Collection operations
 */
// export async function getCollections(): Promise<Collection[]> {
//   const res = await fourthwallGet<{ results: FourthwallCollection[] }>(path.join(API_URL, 'products'), {});

//   return res.body.map((collection) => ({
//     handle: collection.slug,
//     title: collection.name,
//     description: collection.description,
//   }));
// }

export async function getProducts({
  currency,
  limit,
}: {
  currency: string;
  limit?: number;
}): Promise<Product[]> {
  const res = await fourthwallGet<FourthwallProduct[]>(path.join(API_URL, ENDPOINTS.PRODUCTS), {
    currency,
    limit
  });

  if (!res.body) {
    console.warn(`No products found`);
    return [];
  }

  return reshapeProducts(res.body);
}

/**
 * Product operations
 */
export async function getProduct({ handle, currency } : { handle: string, currency: string }): Promise<Product | undefined> {
  const res = await fourthwallGet<FourthwallProduct>(path.join(API_URL, ENDPOINTS.PRODUCTS, handle), { currency });

  return reshapeProduct(res.body);
}

/**
 * Cart operations
 */
export async function getCart(): Promise<Cart | undefined> {
  try {
    // Use stub data instead of real API call
    const cartData = await fourthwallGet<WooCommerceCart>(path.join(API_URL, ENDPOINTS.CART.GET), {
      cache: 'no-store'
    });

    return reshapeCart(cartData.body);
  } catch (e) {
    console.error('CART ERROR', e);
    return undefined;
  }
}

// export async function createCart(): Promise<Cart> {
//   try {
//     const res = await fourthwallPost<FourthwallCart>(path.join(API_URL, 'carts'), {
//       items: []
//     });

//     return reshapeCart(res.body);
//   } catch (e) {
//     console.error('CART CREATE ERROR', e);
//     throw e;
//   }
// }

export async function addToCart(
  productId: string,
  quantity: number = 1
): Promise<Cart> {

  const res = await fourthwallPost<WooCommerceCart>(path.join(API_URL, ENDPOINTS.CART.ADD_ITEM), {
    id: productId,
    quantity: quantity,
  }, {
    cache: 'no-store'    
  });

  const reshaped = reshapeCart(res.body);

  return reshaped;
}

export async function removeFromCart(productId: string): Promise<Cart> {
  const res = await fourthwallPost<WooCommerceCart>(path.join(API_URL, ENDPOINTS.CART.DELETE_ITEM), {
    id: productId,
  }, {
    cache: 'no-store',
    method: 'DELETE'
  });

  return reshapeCart(res.body);
}

export async function updateCart(
  productId: string,
  quantity: number
): Promise<Cart> {

  const res = await fourthwallPost<WooCommerceCart>(path.join(API_URL, ENDPOINTS.CART.UPDATE_ITEM), {
    id: productId,
    quantity: quantity,
  }, {
    cache: 'no-store',
    method: 'PUT'
  });

  return reshapeCart(res.body);
}

// For testing purposes - simulated cart response
export async function getCartStub(): Promise<WooCommerceCart> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        "items": [{
          "key": "47794ed33f1f285251ee8de8530420b4",
          "product_id": 277,
          "type": "simple",
          "quantity": 1,
          "quantity_limits": {
            "minimum": 1,
            "maximum": 9999,
            "multiple_of": 1,
            "editable": true
          },
          "name": "Long Sleeve Tee",
          "short_description": "<p>This is a simple product.</p>\n",
          "description": "<p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.</p>\n",
          "sku": "woo-long-sleeve-tee",
          "low_stock_remaining": false,
          "backorders_allowed": false,
          "show_backorder_badge": false,
          "sold_individually": false,
          "images": [{
            "id": 101,
            "src": "http://localhost:10004/wp-content/uploads/2025/02/long-sleeve-tee-2.jpg",
            "thumbnail": "http://localhost:10004/wp-content/uploads/2025/02/long-sleeve-tee-2.jpg",
            "sizes": "(max-width: 801px) 100vw, 801px",
            "name": "long-sleeve-tee-2.jpg",
            "alt": "",
            "srcset": "http://localhost:10004/wp-content/uploads/2025/02/long-sleeve-tee-2.jpg"
          }],
          "variation": [],
          "item_data": [],
          "permalink": "",
          "prices": {
            "price": 2500,
            "regular_price": 2500,
            "sale_price": 2500,
            "price_range": [],
            "currency_code": "USD",
            "currency_symbol": "$",
            "currency_minor_unit": 2,
            "currency_decimal_separator": ".",
            "currency_thousand_separator": ",",
            "currency_prefix": "$",
            "currency_suffix": ""
          },
          "totals": {
            "line_subtotal": 2500,
            "line_subtotal_tax": 0,
            "line_total": 2500,
            "line_total_tax": 0,
            "currency_code": "USD",
            "currency_symbol": "$",
            "currency_minor_unit": 2,
            "currency_decimal_separator": ".",
            "currency_thousand_separator": ",",
            "currency_prefix": "$",
            "currency_suffix": ""
          },
          "catalog_visibility": "visible",
          "extensions": []
        }],
        "coupons": [],
        "fees": [],
        "totals": {
          "total_items": 2500,
          "total_items_tax": 0,
          "total_fees": 0,
          "total_fees_tax": 0,
          "total_discount": 0,
          "total_discount_tax": 0,
          "total_shipping": 0,
          "total_shipping_tax": 0,
          "total_price": 2500,
          "total_tax": 0,
          "tax_lines": [],
          "currency_code": "USD",
          "currency_symbol": "$",
          "currency_minor_unit": 2,
          "currency_decimal_separator": ".",
          "currency_thousand_separator": ",",
          "currency_prefix": "$",
          "currency_suffix": ""
        },
        "shipping_address": {
          "first_name": "",
          "last_name": "",
          "address_1": "",
          "address_2": "",
          "company": "",
          "city": "",
          "state": "",
          "postcode": "",
          "country": "",
          "phone": ""
        },
        "billing_address": {
          "first_name": "",
          "last_name": "",
          "address_1": "",
          "address_2": "",
          "company": "",
          "city": "",
          "state": "",
          "postcode": "",
          "country": "",
          "phone": ""
        },
        "needs_shipping": false,
        "needs_payment": true,
        "item_count": 1,
        "item_weight": 0,
        "has_calculated_shipping": true,
        "shipping_rates": [],
        "cross_sells": [],
        "errors": [],
        "extensions": []
      });
    }, 10);
  });
}
