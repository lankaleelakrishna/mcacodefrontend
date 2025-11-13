interface ApiError extends Error {
  status?: number;
  data?: any;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export class ApiClient {
  // Cart endpoints
  static async addToCart(items: { perfume_id: number; quantity: number; size?: string }[], token?: string) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ items }),
      headers: token ? { Authorization: token } : undefined,
    });
  }

  static async getCart(token?: string) {
    return this.request('/cart', {
      method: 'GET',
  headers: token ? { Authorization: token } : undefined,
    });
  }

  static async removeFromCart(perfumeId: number, token?: string) {
    return this.request(`/cart/${perfumeId}`, {
      method: 'DELETE',
  headers: token ? { Authorization: token } : undefined,
    });
  }

  static async adminGetAllCarts(token?: string) {
    return this.request('/admin/carts', {
      method: 'GET',
      headers: token ? { Authorization: token } : {},
    });
  }

  private static isNewProduct(createdAt: string): boolean {
    if (!createdAt) return false;
    const productDate = new Date(createdAt);
    const currentDate = new Date();
    const differenceInDays = (currentDate.getTime() - productDate.getTime()) / (1000 * 3600 * 24);
    return differenceInDays <= 30; // Consider products added within last 30 days as new
  }

  private static mapCategory(category: string): string {
    // Map backend category to frontend category format
    const categoryMap: Record<string, string> = {
      'men': 'Men',
      'women': 'Women',
      'unisex': 'Unisex'
    };
    return categoryMap[category.toLowerCase()] || category;
  }

  private static async handleResponse(response: Response) {
    if (!response.ok) {
      const error: ApiError = new Error('API request failed');
      error.status = response.status;
      try {
        // attempt to parse JSON body
        error.data = await response.json();
        // If server provided a message, include it in Error.message for easier debugging upstream
        if (error.data && (error.data.message || error.data.error)) {
          error.message = String(error.data.message || error.data.error);
        } else {
          // fallback to stringified data to avoid [object Object]
          try {
            error.message = JSON.stringify(error.data);
          } catch {
            // leave original message
          }
        }
      } catch {
        error.data = await response.text();
      }
      throw error;
    }
    return response.json();
  }

  private static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    // If body is FormData, don't set Content-Type so the browser can add the correct multipart boundary
    const isFormData = options.body instanceof FormData;
    let headers: Record<string, any> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    // Normalize Authorization header cautiously:
    // - If header already has a Bearer prefix, leave it.
    // - If header looks like a raw JWT (three base64url parts), don't add Bearer (some backends expect raw token).
    // - Otherwise, add the Bearer prefix for endpoints that expect it.
    if (headers && typeof headers.Authorization === 'string') {
      const auth = headers.Authorization as string;
      const isBearer = /^Bearer\s+/i.test(auth);
      const isJwtLike = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(auth);
      if (!isBearer && !isJwtLike && auth) {
        headers.Authorization = `Bearer ${auth}`;
      }
      // if isJwtLike, leave as raw token; if isBearer, also leave as-is
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // For handling cookies
      });
      return await ApiClient.handleResponse(response);
    } catch (error) {
      // If server indicates it expects a raw token (not 'Bearer <token>'), retry once without the Bearer prefix.
      try {
        if (error && typeof error === 'object' && (error as any).status === 401) {
          const msg = String((error as any).message || (error as any).data || '');
          if (/raw token/i.test(msg) && headers && typeof headers.Authorization === 'string' && /^Bearer\s+/i.test(headers.Authorization)) {
            const retryHeaders = { ...headers, Authorization: headers.Authorization.replace(/^Bearer\s+/i, '') };
            try {
              const retryRes = await fetch(url, { ...options, headers: retryHeaders, credentials: 'include' });
              return await ApiClient.handleResponse(retryRes);
            } catch (retryErr) {
              // fall through to outer handler
            }
          }
        }
      } catch (e) {
        // ignore retry preparation errors and fall through to main handler
      }

      if (error instanceof Error) {
        // Network error or server down
        if (error.message === 'Failed to fetch' || error.message.includes('ERR_CONNECTION_REFUSED')) {
          throw new Error('Unable to connect to the server. Please try again later.');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Auth endpoints
  static async login(email: string, password: string) {
    return this.request('/customer/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Public perfumes
  private static transformPerfume(p: any) {
    return {
      id: p.id,
      name: p.name,
      price: Number(p.discounted_price || p.price || 0),
      originalPrice: p.original_price || p.price,
      category: this.mapCategory(p.category || 'Uncategorized'),
      fragranceType: p.fragranceType || p.fragrance_type || 'All',
      description: p.description || '',
      image: p.photo_url,
      rating: p.rating ?? 5,
      reviews: p.reviews ?? 0,
      notes: {
        top: p.top_notes ? p.top_notes.split(',').map((n: string) => n.trim()) : [],
        heart: p.heart_notes ? p.heart_notes.split(',').map((n: string) => n.trim()) : [],
        base: p.base_notes ? p.base_notes.split(',').map((n: string) => n.trim()) : []
      },
      sizes: p.size ? [p.size] : ['50ml'],
      inStock: p.available === 1 && (p.quantity > 0),
      created_at: p.created_at,
      isNew: p.created_at ? ApiClient.isNewProduct(p.created_at) : false,
      isBestSeller: p.is_best_seller || p.total_sold > 100, // Consider either explicitly marked best sellers or those with significant sales
      isSale: p.discount_percentage > 0 || p.original_price !== undefined,
      stockLevel: p.stock_level || (p.quantity <= 5 ? 'low' : 'available'),
      totalSold: p.total_sold || 0,
      discountPercentage: p.discount_percentage || 0,
      discountEndDate: p.end_date ? new Date(p.end_date) : undefined
    };
  }

  static async getPerfumes(params?: Record<string, any>) {
    const query = params
      ? '?' + new URLSearchParams(Object.entries(params).reduce((acc, [k, v]) => (v != null ? ((acc[k] = String(v)), acc) : acc, acc), {} as Record<string,string>))
      : '';
    const response = await this.request(`/perfumes${query}`);
    
    if (response && response.perfumes) {
      return {
        ...response,
        perfumes: response.perfumes.map(this.transformPerfume.bind(this))
      };
    }
    return response;
  }

  static async getBestSellers() {
    const response = await this.request('/perfumes/best-sellers');
    if (response && response.best_sellers) {
      return {
        ...response,
        perfumes: response.best_sellers.map(this.transformPerfume.bind(this))
      };
    }
    return response;
  }

  static async getNewArrivals() {
    const response = await this.request('/perfumes/new-arrivals');
    if (response && response.new_arrivals) {
      return {
        ...response,
        perfumes: response.new_arrivals.map(this.transformPerfume.bind(this))
      };
    }
    return response;
  }

  static async getSpecialOffers() {
    const response = await this.request('/perfumes/special-offers');
    if (response && response.special_offers) {
      return {
        ...response,
        perfumes: response.special_offers.map(this.transformPerfume.bind(this))
      };
    }
    return response;
  }

  static async getPerfumeDetails(id: number) {
    return this.request(`/perfumes/${id}`);
  }

  // Admin perfumes (require Authorization header)
  static async adminGetPerfumes(token?: string) {
    return this.request('/admin/perfumes', {
      method: 'GET',
      headers: token ? { Authorization: token } : {},
    });
  }

  static async adminAddPerfume(formData: FormData, token?: string) {
    return this.request('/admin/perfumes', {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: token } : {},
    });
  }

  static async adminUpdatePerfume(formData: FormData, token?: string) {
    return this.request('/admin/perfumes', {
      method: 'PUT',
      body: formData,
      headers: token ? { Authorization: token } : {},
    });
  }

  static async adminDeletePerfume(id: number | string, token?: string) {
    const body = new URLSearchParams();
    body.append('id', String(id));
    return this.request('/admin/perfumes', {
      method: 'DELETE',
      body: body.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
          ...(token ? { Authorization: token } : {}),
      },
    });
  }

  // Admin sections management
  static async adminGetDashboard(token?: string) {
    return this.request('/admin/dashboard', {
      headers: token ? { Authorization: token } : {},
    });
  }

  // Special offers management
  static async adminAddSpecialOffer(formData: FormData, token?: string) {
    return this.request('/admin/special-offers', {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: token } : {},
    });
  }

  static async adminUpdateSpecialOffer(id: number, formData: FormData, token?: string) {
    return this.request(`/admin/special-offers/${id}`, {
      method: 'PUT',
      body: formData,
      headers: token ? { Authorization: token } : {},
    });
  }

  static async adminRemoveSpecialOffer(id: number, token?: string) {
    return this.request(`/admin/special-offers/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: token } : {},
    });
  }

  // Best seller management
  static async adminGetAllSalesData(token?: string) {
    return this.request('/admin/sales/data', {
      headers: token ? { Authorization: token } : {},
    });
  }

  static async adminUpdatePerfumeBestSeller(formData: FormData, token?: string) {
    return this.request('/admin/perfumes/best-seller', {
      method: 'PUT',
      body: formData,
      headers: token ? { Authorization: token } : {},
    });
  }

  static async adminGetSalesReport(startDate?: string, endDate?: string, token?: string) {
    const query = startDate && endDate ? `?start=${startDate}&end=${endDate}` : '';
    return this.request(`/admin/sales/report${query}`, {
      headers: token ? { Authorization: token } : {},
    });
  }

  // Order endpoints
  static async createOrder(payload: import('./api-client/orders').OrderPayload, token: string) {
    return this.request('/orders', {
      method: 'POST',
      headers: {
        Authorization: token
      },
      body: JSON.stringify(payload)
    });
  }

  static async getOrders(token: string) {
    return this.request('/orders', {
      headers: {
        Authorization: token
      }
    });
  }

  /**
   * Fetch a user's recent orders (compact endpoint).
   * This connects to the backend route `/recent-orders?limit=` which returns the latest orders.
   */
  static async getRecentOrders(token?: string, limit: number = 5) {
    const q = limit ? `?limit=${Number(limit)}` : '';
    return this.request(`/recent-orders${q}`, {
      headers: token ? { Authorization: token } : {},
    });
  }

  // Admin orders & payments (require Authorization header)
  static async adminListOrders(params?: { status?: string; user_id?: number; page?: number; per_page?: number }, token?: string) {
    const query = params
      ? '?' + new URLSearchParams(Object.entries(params).reduce((acc, [k, v]) => (v != null ? ((acc[k] = String(v)), acc) : acc, acc), {} as Record<string,string>))
      : '';
    return this.request(`/admin/orders${query}`, {
      method: 'GET',
      headers: token ? { Authorization: token } : {},
    });
  }

  static async adminGetOrder(orderId: number | string, token?: string) {
    return this.request(`/admin/orders/${orderId}`, {
      method: 'GET',
      headers: token ? { Authorization: token } : {},
    });
  }

  static async adminUpdateOrderStatus(orderId: number | string, status: string, token?: string) {
    try {
      return await this.request(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: token ? { Authorization: token } : {},
      });
    } catch (err) {
      // Some backends expect form-encoded payloads instead of JSON for PATCH endpoints.
      // If server returns a 400 Bad Request, retry once using application/x-www-form-urlencoded.
      try {
        if (err && typeof err === 'object' && (err as any).status === 400) {
          const body = new URLSearchParams();
          body.append('status', String(status));
          return await this.request(`/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            body: body.toString(),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              ...(token ? { Authorization: token } : {}),
            },
          });
        }
      } catch (retryErr) {
        // if retry fails, fall through and throw original error below
      }
      throw err;
    }
  }

  static async adminListPayments(token?: string) {
    return this.request('/admin/payments', {
      method: 'GET',
      headers: token ? { Authorization: token } : {},
    });
  }

  // Reviews endpoints
  static async getAllReviews() {
    return this.request('/reviews');
  }

  static async getRecentReviews() {
    return this.request('/reviews/recent');
  }

  static async getProductReviews(productId: number) {
    return this.request(`/perfumes/${productId}/reviews`);
  }

  static async submitReview(productId: number, review: {
    rating: number;
    content: string;
  }) {
    return this.request(`/perfumes/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }

  // Admin reviews management
  static async adminGetAllReviews(token?: string) {
    return this.request('/admin/reviews', {
      method: 'GET',
      headers: token ? { Authorization: token } : {},
    });
  }

  static async adminDeleteReview(reviewId: number, token?: string) {
    return this.request(`/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: token ? { Authorization: token } : {},
    });
  }
}