export type WooCommerceCart = {
  items: {
    key: string;
    product_id: number;
    quantity: number;
    name: string;
    sku: string;
    images: {
      id: number;
      src: string;
      thumbnail: string;
      alt: string;
    }[];
    totals: {
      line_total: number;
      currency_code: string;
      currency_minor_unit: number;
    };
  }[];
  totals: {
    total_items: number;
    total_price: number;
    currency_code: string;
    currency_minor_unit: number;
  };
};

export type Cart = {
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
  };
  totalQuantity: number;  
  lines: CartItem[];
  currency: string;
};

export type CartProduct = {
  id: string;
  handle: string;
  title: string;
  featuredImage: Image;
};

export type CartItem = {
  id: string | undefined;
  quantity: number;
  cost: {
    totalAmount: Money;
  };
  merchandise: {
    id: string;
    title: string;
    selectedOptions: {
      name: string;
      value?: string;
    }[];
    product: CartProduct;
  };
};

export type Collection = {
  handle: string;
  title: string;
  description: string;
};

export type Image = {
  url: string;
  altText: string;
  width: number;
  height: number;
};

export type Money = {
  amount: string;
  currencyCode: string;
};

export type Product = {
  id: string;
  handle: string;
  availableForSale: boolean;
  title: string;
  description: string;
  descriptionHtml: string;
  options: ProductOption[];
  price: Money;
  featuredImage: Image;
  tags: string[];
  updatedAt: string;
  images: Image[];
};

export type ProductOption = {
  id: string;
  name: string;
  values: string[];
};
