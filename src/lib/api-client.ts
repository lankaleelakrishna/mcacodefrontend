let router: any;

export function setRouter(r: any) {
  router = r;
}

export function navigateTo(path: string, options?: { replace?: boolean }) {
  if (router) {
    router.push({ path, ...options });
  } else if (typeof window !== 'undefined') {
    window.location.href = path;
  }
}

interface ApiError extends Error {
  status?: number;
  data?: any;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export class ApiClient {
  // Get recent orders for the authenticated user. Backend endpoint used by pages is `/recent-orders`.
  static async getRecentOrders(token?: string, limit?: number) {
    const q = limit ? `?limit=${encodeURIComponent(String(limit))}` : '';
    return this.request(`/recent-orders${q}`, {
      method: 'GET',
      headers: token ? { Authorization: token } : {},
    });
  }

  // Backwards-compatible wrapper used by some components (e.g. Navbar)
  static async getUserOrders(token?: string, opts?: { limit?: number }) {
    return this.getRecentOrders(token, opts?.limit);
  }
  // Cart endpoints
  static async addToCart(items: { perfume_id: number; quantity: number; size?: string }[], token?: string) {
    if (!token) throw new Error('Authentication required');
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ items }),
      headers: { Authorization: token },
    });
  }

  // Utility to extract an array of items from various possible API response shapes
  private static extractPerfumes(response: any, keys?: string[]) {
    if (!response) return [];

    // If the response itself is an array, return it
    if (Array.isArray(response)) return response;

    const tryKeys = keys || ['perfumes', 'data', 'items', 'offers', 'special_offers', 'new_arrivals', 'best_sellers', 'products'];

    for (const key of tryKeys) {
      // direct property
      if (Array.isArray(response[key])) {
        if (import.meta.env.DEV) console.debug(`[ApiClient] extractPerfumes: using response['${key}']`);
        return response[key];
      }

      // nested under response.data
      if (response.data && Array.isArray(response.data[key])) {
        if (import.meta.env.DEV) console.debug(`[ApiClient] extractPerfumes: using response.data['${key}']`);
        return response.data[key];
      }

      // sometimes the array is directly under response.data
      if (key === 'data' && Array.isArray(response.data)) {
        if (import.meta.env.DEV) console.debug(`[ApiClient] extractPerfumes: using response.data`);
        return response.data;
      }
    }

    // As a last resort, check common nested shapes
    if (response.results && Array.isArray(response.results)) {
      if (import.meta.env.DEV) console.debug(`[ApiClient] extractPerfumes: using response.results`);
      return response.results;
    }
    if (response.items && Array.isArray(response.items)) {
      if (import.meta.env.DEV) console.debug(`[ApiClient] extractPerfumes: using response.items`);
      return response.items;
    }

    // deeper payload shapes
    if (response.payload && Array.isArray(response.payload)) {
      if (import.meta.env.DEV) console.debug(`[ApiClient] extractPerfumes: using response.payload`);
      return response.payload;
    }
    if (response.payload && Array.isArray(response.payload.items)) {
      if (import.meta.env.DEV) console.debug(`[ApiClient] extractPerfumes: using response.payload.items`);
      return response.payload.items;
    }

    if (import.meta.env.DEV) console.debug('[ApiClient] extractPerfumes: no candidate array found, returning empty list');
    return [];
  }

  static async getCart(token?: string) {
    if (!token) throw new Error('Authentication required');
    return this.request('/cart', {
      method: 'GET',
      headers: { Authorization: token },
    });
  }

  // Place an order (checkout)
  static async checkout(orderData: any, token?: string) {
    if (!token) throw new Error('Authentication required');
    // Backend checkout route is mounted at /checkout (no /cart prefix)
    return this.request('/checkout', {
      method: 'POST',
      body: JSON.stringify(orderData),
      // Back-end expects raw JWT token (no 'Bearer ' prefix)
      headers: { Authorization: token },
    });
  }

  static async removeFromCart(perfumeId: number, token?: string) {
    if (!token) throw new Error('Authentication required');
    return this.request(`/cart/${perfumeId}`, {
      method: 'DELETE',
      headers: { Authorization: token },
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
    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      // Centralized handling for authentication failures (401 / token issues)
      try {
        const status = response.status;
        const msg = (responseData && (responseData.message || responseData.error)) || '';
        const lower = String(msg).toLowerCase();
        if (status === 401 || /token expired|invalid token|invalid jwt|jwt expired/i.test(lower)) {
          try {
            localStorage.removeItem('token');
          } catch (e) {
            // ignore storage errors
          }
          try {
            // Use client-side navigation (router) if available; falls back to full reload
            navigateTo('/login', { replace: true });
          } catch (e) {
            /* ignore */
          }
        }
      } catch (e) {
        // Ignore errors in auth-handling path so we don't mask API errors
      }

      const error: ApiError = new Error('API request failed');
      error.status = response.status;
      error.data = responseData;

      if (responseData) {
        console.error(`API Error [${response.status}]:`, responseData);
        throw new Error(responseData.message || responseData.error || `API Error: ${response.status}`);
      } else {
        throw error;
      }
    }

    console.log('API Response:', responseData);
    return responseData;
  }

  private static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    // If body is FormData, don't set Content-Type so the browser can add the correct multipart boundary
    const isFormData = options.body instanceof FormData;
    
    let headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    } as Record<string, any>;

    // Clean up empty Authorization headers
    if (headers.Authorization === '') {
      delete headers.Authorization;
    }

    try {
      // Prevent customer-only endpoints from being called when viewing admin pages.
      // This avoids 403 (Access denied — Customer only) noise in admin UI.
      try {
        if (typeof window !== 'undefined' && window.location && String(window.location.pathname).startsWith('/admin')) {
          // If client code attempts to call cart/favorites while on admin routes, return a safe stub.
          if (endpoint.startsWith('/cart')) {
            if ((options.method || 'GET').toUpperCase() === 'GET') return { cart_items: [] } as any;
            // For POST/DELETE to /cart, return a simple success response to satisfy callers
            return { ok: true } as any;
          }
          if (endpoint.startsWith('/favorites') || endpoint.includes('/favorites')) {
            if ((options.method || 'GET').toUpperCase() === 'GET') return { favorites: [] } as any;
            return { ok: true } as any;
          }
        }
      } catch (e) {
        // ignore errors from admin-route guard
      }
      console.log(`[API] ${options.method || 'GET'} ${url}`, headers); // Debug log with headers
      const response = await fetch(url, {
        ...options,
        headers
      });

      // For 500 errors on product endpoints, return empty arrays
      if (!response.ok && response.status === 500 && 
          (endpoint.includes('/perfumes/best-sellers') || 
           endpoint.includes('/perfumes/special-offers') || 
           endpoint.includes('/perfumes/new-arrivals'))) {
        console.warn(`[API] Server error for ${endpoint}, returning empty array`);
        return { perfumes: [] };
      }

      return await ApiClient.handleResponse(response);
    } catch (error) {
      console.error(`[API] Error for ${endpoint}:`, error);
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
    // Parse dates
    const currentDate = new Date();
    const endDate = p.end_date ? new Date(p.end_date) : null;
    const isOfferValid = !endDate || endDate > currentDate;

    // Handle prices in order of precedence
    const regularPrice = Number(p.original_price || p.price || 0); // Original/regular price
    const specialPrice = p.discounted_price ? Number(p.discounted_price) : null; // Special offer price
    
    // Determine if special offer is valid
    const isValidOffer = specialPrice !== null && 
                        specialPrice < regularPrice && 
                        isOfferValid;
    
    // Set prices
    const currentPrice = isValidOffer ? specialPrice : regularPrice;
    const displayOriginalPrice = isValidOffer ? regularPrice : undefined;
    
    // Normalize rating and total reviews robustly.
    const totalReviews = Number(p.total_reviews ?? p.reviews ?? p.perfume?.total_reviews ?? 0) || 0;
    // prefer average_rating when available, otherwise rating; coerce to number
    let averageRating = Number(p.average_rating ?? p.rating ?? p.perfume?.average_rating ?? 0) || 0;
    // If there are no reviews, ensure rating is 0 (avoid backend defaulting to 5)
    if (totalReviews === 0) averageRating = 0;

    return {
      id: p.id,
      name: p.name,
      price: currentPrice,
      originalPrice: displayOriginalPrice,
      category: this.mapCategory(p.category || 'Uncategorized'),
      fragranceType: p.fragranceType || p.fragrance_type || 'All',
      description: p.description || '',
      image: p.photo_url,
      // expose consistent fields expected by the UI
      rating: averageRating,
      reviews: totalReviews,
      notes: {
        top: p.top_notes ? p.top_notes.split(',').map((n: string) => n.trim()) : [],
        heart: p.heart_notes ? p.heart_notes.split(',').map((n: string) => n.trim()) : [],
        base: p.base_notes ? p.base_notes.split(',').map((n: string) => n.trim()) : []
      },
      sizes: p.size ? [p.size] : ['50ml'],
      inStock: p.available === 1 && (p.quantity > 0),
      created_at: p.created_at,
      // Keep both snake_case and camelCase flags for compatibility across codebase
      isNew: p.created_at ? ApiClient.isNewProduct(p.created_at) : false,
      is_new: p.created_at ? ApiClient.isNewProduct(p.created_at) : false,
      is_best_seller: Boolean(p.is_best_seller || p.isBestSeller),
      isBestSeller: Boolean(p.is_best_seller || p.isBestSeller),
      isSale: isValidOffer,
      discounted_price: specialPrice,  // Keep track of special offer price
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
    const rawList = this.extractPerfumes(response, ['perfumes', 'products', 'items', 'data']);
    const transformed = (rawList || []).map(this.transformPerfume.bind(this));

    if (transformed.length) {
      // Merge active special offers so products page shows discounted prices
      try {
        const specialsResp = await this.getSpecialOffers();
        const specials = specialsResp?.perfumes || [];
        if (Array.isArray(specials) && specials.length) {
          const specialsMap = new Map<number, any>();
          specials.forEach((s: any) => {
            if (s && s.id != null) specialsMap.set(Number(s.id), s);
          });

          const merged = transformed.map(tp => {
            const special = specialsMap.get(Number(tp.id));
            if (special) {
              return {
                ...tp,
                price: special.price ?? tp.price,
                originalPrice: special.originalPrice ?? tp.originalPrice,
                isSale: true
              };
            }
            return tp;
          });

          return { ...response, perfumes: merged };
        }
      } catch (e) {
        console.error('[ApiClient] getPerfumes: failed to merge special offers', e);
      }

      return { ...response, perfumes: transformed };
    }

    return { perfumes: [] };
  }

  static async getBestSellers() {
    const response = await this.request('/perfumes/best-sellers');
    const rawList = this.extractPerfumes(response, ['best_sellers', 'perfumes', 'products', 'items']);
    const transformedProducts = rawList.map(p => {
      const productToTransform = {
        ...p,
        original_price: p.original_price || p.price,
        price: p.original_price || p.price,
        discounted_price: p.discounted_price || null,
        end_date: p.end_date || null
      };

      const transformed = this.transformPerfume(productToTransform);
      return {
        ...transformed,
        is_best_seller: true,
        isBestSeller: true,
      };
    });

    // If there are active special offers, ensure best-sellers reflect discounted prices
    try {
      const specialsResp = await this.getSpecialOffers();
      const specials = specialsResp?.perfumes || [];
      if (Array.isArray(specials) && specials.length) {
        const specialsMap = new Map<number, any>();
        specials.forEach((s: any) => {
          if (s && s.id != null) specialsMap.set(Number(s.id), s);
        });

        const merged = transformedProducts.map(tp => {
          const special = specialsMap.get(Number(tp.id));
          if (special) {
            return {
              ...tp,
              // override price fields to show active special
              price: special.price ?? tp.price,
              originalPrice: special.originalPrice ?? tp.originalPrice,
              isSale: true
            };
          }
          return tp;
        });

        return { ...response, perfumes: merged };
      }
    } catch (e) {
      // ignore any errors from specials lookup and return transformed products
      console.error('[ApiClient] getBestSellers: failed to merge special offers', e);
    }

    return { ...response, perfumes: transformedProducts };
  }

  static async getNewArrivals() {
    const response = await this.request('/perfumes/new-arrivals');
    const rawList = this.extractPerfumes(response, ['new_arrivals', 'perfumes', 'products', 'items']);
    const transformedProducts = rawList.map(p => {
      const productToTransform = {
        ...p,
        original_price: p.original_price || p.price,
        price: p.original_price || p.price,
        discounted_price: p.discounted_price || null,
        end_date: p.end_date || null
      };
      const transformed = this.transformPerfume(productToTransform);
      return {
        ...transformed,
        isNew: true,
        is_new: true
      };
    });

    // Ensure new-arrivals reflect any active special offers
    try {
      const specialsResp = await this.getSpecialOffers();
      const specials = specialsResp?.perfumes || [];
      if (Array.isArray(specials) && specials.length) {
        const specialsMap = new Map<number, any>();
        specials.forEach((s: any) => {
          if (s && s.id != null) specialsMap.set(Number(s.id), s);
        });

        const merged = transformedProducts.map(tp => {
          const special = specialsMap.get(Number(tp.id));
          if (special) {
            return {
              ...tp,
              price: special.price ?? tp.price,
              originalPrice: special.originalPrice ?? tp.originalPrice,
              isSale: true
            };
          }
          return tp;
        });

        return { ...response, perfumes: merged };
      }
    } catch (e) {
      console.error('[ApiClient] getNewArrivals: failed to merge special offers', e);
    }

    return { ...response, perfumes: transformedProducts };
  }

  static async getSpecialOffers() {
    const response = await this.request('/perfumes/special-offers');
    const rawList = this.extractPerfumes(response, ['special_offers', 'offers', 'perfumes', 'products', 'items']);
    const transformedProducts = rawList.map(this.transformPerfume.bind(this));
    const activeSpecialOffers = transformedProducts.filter(product =>
      product.isSale &&
      product.price < (product.originalPrice || Infinity)
    );

    return { ...response, perfumes: activeSpecialOffers };
  }

  static async getPerfumeDetails(id: number) {
    const response = await this.request(`/perfumes/${id}`);
    const perfume = response.perfume || response;
    return {
      ...perfume,
      average_rating: perfume.average_rating || 0,
      total_reviews: perfume.total_reviews || 0
    };
  }

  /**
   * Normalize image URL returned by backend.
   * - If empty -> return empty string
   * - If already absolute (http/https/data:) -> return as-is
   * - If starts with '/' -> prefix API base URL
   */
  static getImageUrl(path?: string | null) {
    if (path == null) return '';
    try {
      // If value is an array, try the first item
      if (Array.isArray(path)) {
        return this.getImageUrl(path[0]);
      }

      // If path is an object, try ALL common image keys
      if (typeof path === 'object') {
        const obj: any = path;
        // Comprehensive list of possible image field names
        const candidates = [
          obj.url,
          obj.src,
          obj.photo_url,
          obj.photoUrl,
          obj.photo_Url,
          obj.image,
          obj.image_url,
          obj.imageUrl,
          obj.image_Url,
          obj.photo,
          obj.picture,
          obj.picture_url,
          obj.pictureUrl,
          obj.img,
          obj.img_url,
          obj.imgUrl,
          obj.path,
          obj.filepath,
          obj.file_path,
          obj.filename,
          obj.file,
          obj.location,
          obj.storagePath,
          obj.storage_path,
          obj.fullUrl,
          obj.full_url,
          obj.thumbnail,
          obj.thumb,
          obj.thumb_url,
          obj.thumbUrl,
          obj.icon,
          obj.icon_url,
          obj.iconUrl,
          obj.media,
          obj.media_url,
          obj.mediaUrl,
          obj.uri,
          obj.resource_url,
          obj.resourceUrl,
        ];
        for (const c of candidates) {
          if (c) {
            const resolved = this.getImageUrl(c);
            if (resolved) return resolved;
          }
        }
        // If still no match, try to find any field that looks like a URL or path
        for (const key in obj) {
          if (key.toLowerCase().includes('image') || key.toLowerCase().includes('photo') || key.toLowerCase().includes('url') || key.toLowerCase().includes('pic')) {
            const val = obj[key];
            if (typeof val === 'string' && val.trim().length > 0) {
              const resolved = this.getImageUrl(val);
              if (resolved) return resolved;
            }
          }
        }
        return '';
      }

      const trimmed = String(path).trim();
      if (!trimmed) return '';
      // If already a data URI or absolute URL, return as-is
      if (/^(data:|https?:)\/\//i.test(trimmed)) return trimmed;
      // If starts with slash, prefix API base (no double slash)
      if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
      // If looks like a relative path (e.g. "uploads/..jpg"), also prefix API base
      if (!/^[a-zA-Z0-9_\-]+:\/\//.test(trimmed)) {
        return `${API_BASE_URL}/${trimmed.replace(/^\/+/, '')}`;
      }
      return trimmed;
    } catch (e) {
      return '';
    }
  }

  // Admin perfumes (require Authorization header)
  static async adminGetPerfumes(token?: string) {
    console.log('Getting admin perfumes with token:', token);
    const response = await this.request('/admin/perfumes', {
      method: 'GET',
      headers: token ? { Authorization: token } : {},
    });
    // Ensure we always return { perfumes: [] } even if response format varies
    return {
      perfumes: response?.perfumes || response?.products || (Array.isArray(response) ? response : [])
    };
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
    console.log('[apiClient.adminDeletePerfume] Sending DELETE with id:', id, 'body:', body.toString());
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

  static async adminGetBestSellers(token?: string) {
    console.log('[ApiClient] adminGetBestSellers called');
    try {
      const response = await this.request('/admin/perfumes/best-sellers', {
        method: 'GET',
        headers: token ? { Authorization: token } : {},
      });
      console.log('[ApiClient] adminGetBestSellers response:', response);
      return {
        perfumes: response?.perfumes || response?.products || (Array.isArray(response) ? response : [])
      };
    } catch (e) {
      console.warn('[ApiClient] adminGetBestSellers endpoint not found (404), using fallback: loading all perfumes and filtering locally', e);
      try {
        // Fallback: get all perfumes and filter locally
        const allResponse = await this.adminGetPerfumes(token);
        console.log('[ApiClient] adminGetBestSellers fallback - all perfumes:', allResponse?.perfumes?.length);
        
        const filtered = (allResponse?.perfumes || []).filter((p: any) => {
          const isBestSeller = p.is_best_seller || p.isBestSeller;
          console.log(`[ApiClient] Product ${p.id} (${p.name}): is_best_seller=${isBestSeller}`);
          return isBestSeller;
        });
        
        console.log('[ApiClient] adminGetBestSellers fallback - filtered:', filtered.length);
        return {
          perfumes: filtered
        };
      } catch (fallbackErr) {
        console.error('[ApiClient] adminGetBestSellers fallback also failed:', fallbackErr);
        // Return empty if both fail
        return { perfumes: [] };
      }
    }
  }

  static async adminUpdatePerfumeBestSeller(formData: FormData, token?: string) {
    console.log('[ApiClient] adminUpdatePerfumeBestSeller called with:', {
      id: formData.get('id'),
      is_best_seller: formData.get('is_best_seller'),
      hasToken: !!token
    });
    
    const response = await this.request('/admin/perfumes/best-seller', {
      method: 'PUT',
      body: formData,
      headers: token ? { Authorization: token } : {},
    });
    
    console.log('[ApiClient] adminUpdatePerfumeBestSeller response:', response);
    return response;
  }

  static async adminGetSalesReport(days?: number, token?: string) {
    const query = days ? `?days=${days}` : '';
    return this.request(`/admin/sales/report${query}`, {
      headers: token ? { Authorization: token } : {},
    });
  }

  static async adminGetPerfumeRevenue(perfumeId: number, days?: number, token?: string) {
    const query = days ? `?days=${days}` : '';
    return this.request(`/admin/revenue/perfume/${perfumeId}${query}`, {
      headers: token ? { Authorization: token } : {},
    });
  }

  static async adminGetMonthlyRevenue(token?: string) {
    return this.request('/admin/revenue/monthly', {
      headers: token ? { Authorization: token } : {},
    });
  }

  // Reviews endpoints
  static async getRecentReviews() {
    // Try multiple common review endpoints in order until one succeeds.
    const candidates = [
      '/reviews/recent',
      '/perfumes/recent-reviews',
      '/perfumes/recent_reviews',
      '/perfumes/recent',
      '/reviews',
      '/perfumes/reviews/recent',
    ];

    let lastErr: any = null;
    for (const ep of candidates) {
      try {
        if (import.meta.env.DEV) console.debug(`[ApiClient] trying reviews endpoint: ${ep}`);
        const resp = await this.request(ep);
        if (resp) {
          if (import.meta.env.DEV) console.debug('[ApiClient] reviews endpoint succeeded:', ep, resp);
          return resp;
        }
      } catch (e) {
        lastErr = e;
        if (import.meta.env.DEV) console.debug(`[ApiClient] reviews endpoint failed (${ep}):`, e?.message || e);
        // try next candidate
      }
    }

    // If none succeeded, throw the last error or a generic one so callers can fallback
    if (lastErr) throw lastErr;
    throw new Error('No reviews endpoint available');
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

  // Admin reviews
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

  // Admin orders
  static async adminGetAllOrders(
    page = 1,
    limit = 20,
    status?: string,
    startDate?: string,
    endDate?: string,
    token?: string
  ) {
    const params: Record<string, any> = { page, limit };
    if (status) params.status = status;
    if (startDate) params.start = startDate;
    if (endDate) params.end = endDate;
    const q = new URLSearchParams(params as Record<string,string>).toString();
    return this.request(`/admin/orders?${q}`, {
      method: 'GET',
      headers: token ? { Authorization: token } : {},
    });
  }
}