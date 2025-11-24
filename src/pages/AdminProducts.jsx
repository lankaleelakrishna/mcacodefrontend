import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import AdminNavigation from "@/components/admin/AdminNavigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { ApiClient } from "@/lib/api-client";

const emptyForm = { id: null, title: "", price: "", description: "", image: "", discounted_price: "", discount_percentage: "", end_date: "" };

export default function AdminProducts() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [productDescriptions, setProductDescriptions] = useState({});

  const handleAddToBestSeller = async (product) => {
    // Add product to best sellers - store in localStorage for persistence
    console.log('[AdminProducts] handleAddToBestSeller called with product:', product.id, product.name);

    try {
      // Get existing best sellers from localStorage
      const bestSellersList = JSON.parse(localStorage.getItem('bestSellers') || '[]');
      
      // Check if already in best sellers
      const alreadyAdded = bestSellersList.some((p) => p.id === product.id);
      if (alreadyAdded) {
        alert(`${product.name} is already in Best Sellers!`);
        return;
      }
      
      // Add to best sellers
      bestSellersList.push(product);
      localStorage.setItem('bestSellers', JSON.stringify(bestSellersList));
      
      console.log('[AdminProducts] Product added to localStorage best sellers:', bestSellersList);

      // Update local UI state so button disables
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_best_seller: true } : p));

      // Also try to sync with backend
      try {
        const formData = new FormData();
        formData.append('id', String(product.id));
        formData.append('is_best_seller', 'true');
        await ApiClient.adminUpdatePerfumeBestSeller(formData, token);
      } catch (apiErr) {
        console.warn('[AdminProducts] Backend sync failed, but localStorage saved:', apiErr);
      }
      
      // Trigger a custom event to notify ManageSections to refresh
      window.dispatchEvent(new Event('bestSellerUpdated'));
      
      alert(`${product.name} added to Best Sellers!`);
    } catch (err) {
      console.error('[AdminProducts] Error adding to best sellers:', err);
      alert('Failed to add to best sellers: ' + err.message);
    }
  };

  useEffect(() => {
    // load products from backend (admin)
    const load = async () => {
      if (!token) {
        console.error('No auth token available');
        return;
      }
      
      // Load descriptions from localStorage
      let localDescriptions = {};
      try {
        const stored = localStorage.getItem('productDescriptions');
        if (stored) {
          localDescriptions = JSON.parse(stored);
          console.log('[AdminProducts] Loaded descriptions from localStorage:', localDescriptions);
          setProductDescriptions(localDescriptions);
        }
      } catch (e) {
        console.error('Error loading descriptions from localStorage:', e);
      }
      
      try {
        console.log('Loading admin products with token:', token);
        const res = await ApiClient.adminGetPerfumes(token);
        console.log('Admin products response:', res);
        
        if (res && res.perfumes) {
          // Merge localStorage best sellers so UI reflects local additions
          let merged = res.perfumes;
          try {
            const stored = JSON.parse(localStorage.getItem('bestSellers') || '[]');
            const bestIds = new Set((stored || []).map((b) => b.id));
            merged = res.perfumes.map(p => ({ ...p, is_best_seller: bestIds.has(p.id) }));
          } catch (e) {
            console.warn('[AdminProducts] failed reading local bestSellers', e);
          }
          setProducts(merged);
          console.log('Set products (merged with local best sellers):', merged);
          
          // Debug: log ALL fields for first product to find image field
          try {
            if (res.perfumes.length > 0) {
              const firstProduct = res.perfumes[0];
              const keys = Object.keys(firstProduct);
              console.log('[AdminProducts:FIRST_PRODUCT_ALL_KEYS]', keys);
              console.log('[AdminProducts:FIRST_PRODUCT_FULL]', firstProduct);
              res.perfumes.slice(0, 5).forEach((p, idx) => {
                console.log(`[AdminProducts:Product${idx}]`, {
                  id: p.id,
                  name: p.name,
                  title: p.title,
                  description: p.description,
                  allKeys: Object.keys(p),
                });
              });
            }
          } catch (e) {
            console.error('Error logging product debug info', e);
          }
        } else {
          console.warn('No products in response:', res);
          setProducts([]);
        }
      } catch (e) {
        console.error('Failed to load admin products:', e);
        // fallback to localStorage if backend unavailable
        try {
          const raw = localStorage.getItem('admin_products_v1');
          const fallbackProducts = raw ? JSON.parse(raw) : [];
          console.log('Using fallback products:', fallbackProducts);
          setProducts(fallbackProducts);
        } catch (storageError) {
          console.error('Fallback also failed:', storageError);
          setProducts([]);
        }
      }
    };
    load();

    // Keep UI in sync when best sellers change elsewhere
    const refreshBestSellerFlags = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('bestSellers') || '[]');
        const bestIds = new Set((stored || []).map((b) => b.id));
        setProducts(prev => prev.map(p => ({ ...p, is_best_seller: bestIds.has(p.id) })));
        console.log('[AdminProducts] refreshed best seller flags from localStorage');
      } catch (e) {
        console.warn('[AdminProducts] refreshBestSellerFlags error', e);
      }
    };

    window.addEventListener('bestSellerUpdated', refreshBestSellerFlags);
    const storageHandler = (e) => { if (e.key === 'bestSellers') refreshBestSellerFlags(); };
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('bestSellerUpdated', refreshBestSellerFlags);
      window.removeEventListener('storage', storageHandler);
    };
  }, [token]);

  const form = useForm({
    defaultValues: {
      title: "",
      price: "",
      image: "",
      description: "",
  quantity: 100,
  category: 'tops',
      size: [],
      top_notes: '',
      heart_notes: '',
      base_notes: '',
    },
  });
  const { reset, control, setValue, getValues } = form;
  // Local sizes state to keep checkbox UI and form in sync
  const [sizesSelected, setSizesSelected] = useState([]);
  useEffect(() => {
    reset({
      title: "",
      price: "",
      image: "",
      description: "",
      quantity: 100,
      category: "tops",
      size: [],
      top_notes: "",
      heart_notes: "",
      base_notes: "",
      discounted_price: "",
      end_date: "",
    });
    if (import.meta.env.DEV) console.log('[AdminProducts] form reset on products change');
  }, [products]);

  useEffect(() => {
    reset({
      title: "",
      price: "",
      image: "",
      description: "",
      quantity: 100,
      category: "tops",
      size: [],
      top_notes: "",
      heart_notes: "",
      base_notes: "",
      discounted_price: "",
      end_date: ""
    });
  }, []);

  const onSubmit = async (data) => {
    const title = (data.title || "").trim();
    if (!title) return alert("Title is required");
    try {
      // IMPORTANT: Cache the description IMMEDIATELY before sending to backend
      // This ensures descriptions persist even if backend doesn't return them
      if (data.description) {
        const updatedDescriptions = { ...productDescriptions };
        if (editingId) {
          // For edits, we have the ID, so save immediately
          updatedDescriptions[editingId] = data.description;
          console.log('[AdminProducts] Pre-cached description for EDITING ID', editingId, ':', data.description);
        } else {
          // For new products, store with a temp key that we'll update later
          // We'll use a composite key: timestamp + title to avoid collisions
          const tempKey = `temp_${Date.now()}_${title.replace(/\s+/g, '_')}`;
          updatedDescriptions[tempKey] = data.description;
          console.log('[AdminProducts] Pre-cached description with temp key', tempKey, ':', data.description);
        }
        setProductDescriptions(updatedDescriptions);
        try {
          localStorage.setItem('productDescriptions', JSON.stringify(updatedDescriptions));
          console.log('[AdminProducts] Pre-cached descriptions:', updatedDescriptions);
        } catch (e) {
          console.error('Error pre-caching descriptions:', e);
        }
      }
      
      const form = new FormData();
      // backend expects name price description quantity category size etc.
      form.append('name', title);
      form.append('price', String(data.price || '0'));
      form.append('description', data.description || '');
      form.append('quantity', String(data.quantity ?? 100));
      
      // Always send both regular price and special offer price
      form.append('original_price', String(data.price || '0')); // Regular price
      form.append('price', String(data.price || '0')); // Current price
      
      // If there's a special offer
      if (data.discounted_price && Number(data.discounted_price) < Number(data.price)) {
        form.append('discounted_price', String(data.discounted_price));
        form.append('price', String(data.discounted_price)); // Set current price to discounted price
        
        // Calculate discount percentage
        const originalPrice = Number(data.price);
        const discountedPrice = Number(data.discounted_price);
        const discountPercentage = ((originalPrice - discountedPrice) / originalPrice) * 100;
        form.append('discount_percentage', String(Math.round(discountPercentage)));
        
        // Add end date if provided
        if (data.end_date) {
          form.append('end_date', data.end_date);
        }
      } else {
        form.append('discounted_price', '');
        form.append('discount_percentage', '0');
        form.append('end_date', '');
      }
      form.append('category', data.category || 'tops');
      // Append selected sizes (if any) as a comma-separated string (backend expects a single size field)
      if (Array.isArray(sizesSelected) && sizesSelected.length > 0) {
        // join with commas so backend normalize_size_for_storage can parse
        form.append('size', sizesSelected.join(','));
      }
      form.append('top_notes', data.top_notes || '');
      form.append('heart_notes', data.heart_notes || '');
      form.append('base_notes', data.base_notes || '');
      if (file) form.append('photo', file);

      let apiResponse;
      if (editingId) {
        form.append('id', String(editingId));
        // If there's a special offer price, use the special offers endpoint
        if (data.discounted_price) {
          apiResponse = await ApiClient.adminUpdateSpecialOffer(editingId, form, token);
        } else {
          apiResponse = await ApiClient.adminUpdatePerfume(form, token);
        }
      } else {
        // For new products with special offer price, use special offers endpoint
        if (data.discounted_price) {
          apiResponse = await ApiClient.adminAddSpecialOffer(form, token);
          console.log('[AdminProducts] adminAddSpecialOffer response:', apiResponse);
        } else {
          apiResponse = await ApiClient.adminAddPerfume(form, token);
          console.log('[AdminProducts] adminAddPerfume response:', apiResponse);
        }
      }
      
      // Try to extract product ID from the response to update temp keys
      if (apiResponse && !editingId) {
        const productId = apiResponse.id || apiResponse.perfume_id || (apiResponse.perfume && apiResponse.perfume.id);
        if (productId && data.description) {
          const updatedDescriptions = { ...productDescriptions };
          // Find and update any temp keys for this product
          Object.keys(updatedDescriptions).forEach(key => {
            if (key.startsWith('temp_') && updatedDescriptions[key] === data.description) {
              delete updatedDescriptions[key];
            }
          });
          // Add with real ID
          updatedDescriptions[productId] = data.description;
          setProductDescriptions(updatedDescriptions);
          try {
            localStorage.setItem('productDescriptions', JSON.stringify(updatedDescriptions));
            console.log('[AdminProducts] Updated temp key to real ID', productId, ':', data.description);
          } catch (e) {
            console.error('Error updating cache with real ID:', e);
          }
        }
      }

      // reload list
      const res = await ApiClient.adminGetPerfumes(token);
      if (res && res.perfumes) {
        setProducts(res.perfumes);
        
        // Final pass: map all product IDs to their descriptions
        const finalDescriptions = { ...productDescriptions };
        res.perfumes.forEach(p => {
          // If we already have a description for this product, keep it
          if (!finalDescriptions[p.id] && productDescriptions[p.id]) {
            finalDescriptions[p.id] = productDescriptions[p.id];
          }
          // If backend returned description, use it
          if (p.description && p.id) {
            finalDescriptions[p.id] = p.description;
          }
        });
        
        setProductDescriptions(finalDescriptions);
        try {
          localStorage.setItem('productDescriptions', JSON.stringify(finalDescriptions));
          console.log('[AdminProducts] Final descriptions cache:', finalDescriptions);
        } catch (e) {
          console.error('Error saving final descriptions:', e);
        }
      }
      
      reset({ 
        title: "", 
        price: "", 
        image: "", 
        description: "", 
        quantity: 100, 
        category: 'tops', 
        size: [],
        top_notes: '', 
        heart_notes: '', 
        base_notes: '',
        discounted_price: '',
        end_date: ''
      });
      setEditingId(null);
      setFile(null);
    } catch (err) {
      console.error('Error saving perfume', err);
      alert(err.message || 'Failed to save perfume');
    }
  };
  const handleEdit = (product) => {
    console.debug('[AdminProducts:handleEdit] editing product id, incoming size:', product.id, product.size);
    // Try to get description from backend or localStorage
    const descriptionToUse = product.description || productDescriptions[product.id] || '';
    // prefer backend-provided `sizes` array, fall back to comma-separated `size` string
    const sizesForForm = Array.isArray(product.sizes)
      ? product.sizes
      : (product.size ? String(product.size).split(',').map(s => s.trim()).filter(Boolean) : []);

    reset({
      title: product.name || product.title,
      price: product.originalPrice || product.price,
      discounted_price: product.discounted_price || (product.price !== product.originalPrice ? product.price : ''),
      end_date: product.end_date ? new Date(product.end_date).toISOString().split('T')[0] : '',
      image: '',
      description: descriptionToUse,
      quantity: product.quantity || 100,
      category: product.category || 'tops',
      size: sizesForForm,
      top_notes: product.notes?.top?.join(',') || '',
      heart_notes: product.notes?.heart?.join(',') || '',
      base_notes: product.notes?.base?.join(',') || ''
    });
    // ensure the controlled value is set and the checkbox UI reflects backend values
    try {
      setValue('size', sizesForForm);
      setSizesSelected(sizesForForm);
      console.debug('[AdminProducts:handleEdit] set sizes ->', sizesForForm);
    } catch (e) {
      console.error('[AdminProducts:handleEdit] setValue/setSizesSelected error', e);
    }
    setEditingId(product.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await ApiClient.adminDeletePerfume(id, token);
      const res = await ApiClient.adminGetPerfumes(token);
      if (res && res.perfumes) setProducts(res.perfumes);
      if (editingId === id) {
        reset({ title: "", price: "", image: "", description: "", quantity: 100, category: 'tops', size: [], top_notes: '', heart_notes: '', base_notes: '' });
        setEditingId(null);
      }
    } catch (err) {
      console.error('Error deleting perfume', err);
      alert(err.message || 'Failed to delete perfume');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <AdminNavigation />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} style={{ marginBottom: 20, display: "grid", gap: 8 }}>
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg" placeholder="Title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regular Price</FormLabel>
                <FormControl>
                  <Input className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg" type="number" placeholder="Regular Price" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg" type="number" placeholder="Quantity" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <select {...field} className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg">
                    <option value="tops">Tops</option>
                    <option value="lehangas">Lehangas</option>
                    <option value="sarees">Sarees</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <div className="text-sm font-medium">Size</div>
                <FormControl>
                  <div className="flex items-center gap-6">
                    {
                      // Use standard clothing sizes for admin dashboard
                      [
                        { label: 'XS', value: 'XS' },
                        { label: 'S', value: 'S' },
                        { label: 'M', value: 'M' },
                        { label: 'L', value: 'L' },
                        { label: 'XL', value: 'XL' },
                        { label: 'XXL', value: 'XXL' },
                        { label: 'XXXL', value: 'XXXL' },
                      ].map((opt) => (
                      <label key={opt.value} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Array.isArray(sizesSelected) ? sizesSelected.includes(opt.value) : false}
                          onChange={(e) => {
                            const current = Array.isArray(sizesSelected) ? [...sizesSelected] : [];
                            if (e.target.checked) {
                              if (!current.includes(opt.value)) current.push(opt.value);
                            } else {
                              const idx = current.indexOf(opt.value);
                              if (idx > -1) current.splice(idx, 1);
                            }
                            setSizesSelected(current);
                            try { setValue('size', current); } catch (err) { console.error('[AdminProducts:checkbox] error', err); }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL (optional) or upload</FormLabel>
                <FormControl>
                  <Input className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg" placeholder="Image URL (optional)" {...field} />
                </FormControl>
                <div className="mt-2">
                  <input
                    className="w-full"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files && e.target.files[0])}
                  />
                  {file && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'inline-block', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea className="w-full" rows={3} placeholder="Description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="top_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Top Notes</FormLabel>
                <FormControl>
                  <Input className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg" placeholder="Comma separated top notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="heart_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heart Notes</FormLabel>
                <FormControl>
                  <Input className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg" placeholder="Comma separated heart notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="base_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Notes</FormLabel>
                <FormControl>
                  <Input className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg" placeholder="Comma separated base notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <Button type="submit">{editingId ? "Update Product" : "Create Product"}</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset({ title: "", price: "", image: "", description: "", quantity: 100, category: 'tops', size: [], top_notes: '', heart_notes: '', base_notes: '' });
                setEditingId(null);
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Form>

      <div style={{ display: "grid", gap: 12 }}>
        {products.length === 0 && <div>No products yet.</div>}
        {products.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              gap: 12,
              padding: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            {
              (() => {
                const placeholder = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='80'%20height='80'%3E%3Crect%20width='100%25'%20height='100%25'%20fill='%23e5e7eb'/%3E%3Ctext%20x='50%25'%20y='50%25'%20dominant-baseline='middle'%20text-anchor='middle'%20fill='%239ca3af'%20font-family='Arial,%20sans-serif'%20font-size='12'%3ENo%20Image%3C/text%3E%3C/svg%3E";
                
                // Build image URL using the perfume ID and the /perfumes/photo/{id} endpoint
                const photoUrl = `http://127.0.0.1:5000/perfumes/photo/${p.id}`;
                
                return (
                  <img
                    src={photoUrl}
                    alt={p.name || p.title}
                    title={photoUrl}
                    onError={(e) => { if ((e.currentTarget.dataset.fallback ?? "") !== "1") { e.currentTarget.dataset.fallback = "1"; e.currentTarget.src = placeholder; } }}
                    style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6 }}
                  />
                );
              })()
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{p.name || p.title}</div>
              <div style={{ color: "#6b7280", marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordWrap: 'break-word', minHeight: '2.5rem' }}>
                {(() => {
                  const desc = p.description || productDescriptions[p.id];
                  if (import.meta.env.DEV) {
                    console.log(`[AdminProducts Display] Product ${p.id} (${p.name}):`, {
                      fromBackend: p.description,
                      fromLocalStorage: productDescriptions[p.id],
                      final: desc,
                      allStoredDescriptions: productDescriptions
                    });
                  }
                  return desc ? (
                    <span>{desc}</span>
                  ) : (
                    <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>No description available</span>
                  );
                })()}
              </div>
              <div style={{ marginTop: 6 }}>₹{Number(p.price || p.price === 0 ? p.price : 0).toFixed(2)}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: 'center' }}>
              <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>
                Delete
              </Button>
              {!p.is_best_seller && (
                <Button size="sm" variant="default" onClick={() => handleAddToBestSeller(p)}>
                  Add to Best Seller
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
    <Footer />
    </div>
  );
}