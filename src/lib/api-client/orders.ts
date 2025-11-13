import { ApiClient } from '../api-client';

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface CardDetails {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

interface OrderItem {
  cart_id: number; // reference into server's carts table
  // optional: some backends may accept product/perfume ids, but cart_id is authoritative
  perfume_id?: number;
  quantity: number;
  size: string | null;
  price: number;
}

export interface OrderPayload {
  shipping: ShippingInfo;
  payment_method: 'card' | 'cod';
  items: OrderItem[];
  // all totals are optional — server will calculate/validate final amounts
  total_amount?: number;
  tax?: number;
  shipping_cost?: number;
  card_details?: CardDetails;
}

export async function createOrder(payload: OrderPayload, token: string) {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  try {
    return await ApiClient.createOrder(payload, token);
  } catch (error: any) {
    // Enhance error messages
    if (error.status === 404) {
      throw new Error('One or more items in your cart are no longer available');
    }
    throw error;
  }
}
