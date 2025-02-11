'use server';

import { addToCart, removeFromCart, updateCart } from 'lib/fourthwall';
import type { Product } from 'lib/types';
import { cookies } from 'next/headers';

export async function getCartId(): Promise<string | undefined> {
  const tokenHash = process.env.NEXT_PUBLIC_FW_STOREFRONT_TOKEN;
  return cookies().get(`${tokenHash}/cartId`)?.value;
}

function setCartId(cartId: string) {
  const tokenHash = process.env.NEXT_PUBLIC_FW_STOREFRONT_TOKEN;
  cookies().set(`${tokenHash}/cartId`, cartId);
}

export async function addItem(prevState: any, product: Product) {
  try {
    // console.warn('ADDING ITEM', product);
    // const cart = await getCart(await getCartId(), 'USD') || (await createCartAndSetCookie());
    // const cartId = cart.id!!;

    // if (!cart || !selectedVariantId) {
    //   return 'Error adding item to cart';
    // }

    await addToCart(product.id, 1);
    // revalidateTag(TAGS.cart);
  } catch (e) {
    console.error('ERROR', e);
    return 'Error adding item to cart';
  }
}

export async function removeItem(prevState: any, merchandiseId: string) {
  try {
    // const cart = await getCart(await getCartId(), 'USD') || (await createCartAndSetCookie());
    // const cartId = cart.id!!;

    // if (!cart) {
    //   return 'Error fetching cart';
    // }

    // const lineItem = cart.lines.find((line) => line.merchandise.id === merchandiseId);

    // if (lineItem && lineItem.id) {
      await removeFromCart(merchandiseId);
      // revalidateTag(TAGS.cart);
    // } else {
      // return 'Item not found in cart';
    // }
  } catch (e) {
    return 'Error removing item from cart';
  }
}

export async function updateItemQuantity(
  prevState: any,
  payload: {
    merchandiseId: string;
    quantity: number;
  }
) {
  const { merchandiseId, quantity } = payload;

  try {
    // const cart = await getCart(await getCartId(), 'USD') || (await createCartAndSetCookie());
    // const cartId = cart.id!!;

    // if (!cart) {
    //   return 'Error fetching cart';
    // }

    // const lineItem = cart.lines.find((line) => line.merchandise.id === merchandiseId);

    // if (lineItem && lineItem.id) {
    if (quantity === 0) {
      await removeFromCart(merchandiseId);
    } else {
      await updateCart(merchandiseId, quantity);
    }
    // } else if (quantity > 0) {
    // If the item doesn't exist in the cart and quantity > 0, add it
    // await addToCart(cartId, [{ merchandiseId, quantity }]);
    // }

    // revalidateTag(TAGS.cart);
  } catch (e) {
    console.error(e);
    return 'Error updating item quantity';
  }
}

// export async function redirectToCheckout(currency: string) {
//   const CHECKOUT_URL = process.env.NEXT_PUBLIC_FW_CHECKOUT;
//   let cartId = await getCartId();

//   if (!cartId) {
//     return 'Missing cart ID';
//   }

//   let cart = await getCart(cartId, 'USD');

//   if (!cart) {
//     return 'Error fetching cart';
//   }

//   redirect(`${CHECKOUT_URL}/checkout/?cartId=${cartId}&cartCurrency=USD`);
// }

// export async function createCartAndSetCookie() {
//   let cart = await createCart();
//   setCartId(cart.id!!);
//   return cart;
// }
