export interface AdminProduct {
  id: string;
  title: string;
  price: number;
  description: string;
  image: string;
}

export const ADMIN_PRODUCTS_KEY = "admin_products_v1";

export function loadAdminProducts(): AdminProduct[] {
  try {
    const raw = localStorage.getItem(ADMIN_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAdminProducts(list: AdminProduct[]) {
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(list));
  // Dispatch an event to notify other components
  window.dispatchEvent(new Event('adminProductsUpdated'));
}