import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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

const emptyForm = { id: null, title: "", price: "", description: "", image: "" };

export default function AdminProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    // load products from backend (admin)
    const load = async () => {
      try {
        const res = await ApiClient.adminGetPerfumes(token);
        if (res && res.perfumes) setProducts(res.perfumes);
      } catch (e) {
        // fallback to localStorage if backend unavailable
        try {
          const raw = localStorage.getItem('admin_products_v1');
          setProducts(raw ? JSON.parse(raw) : []);
        } catch {
          setProducts([]);
        }
      }
    };
    load();
  }, [token]);

  const form = useForm({
    defaultValues: {
      title: "",
      price: "",
      image: "",
      description: "",
      quantity: 100,
      category: 'tops',
      top_notes: '',
      heart_notes: '',
      base_notes: '',
    },
  });

  const { reset, control } = form;

  const onSubmit = async (data) => {
    const title = (data.title || "").trim();
    if (!title) return alert("Title is required");

    if (!token) {
      alert('Admin token missing or expired. Please login again.');
      return;
    }

    try {
      const form = new FormData();
      // backend expects name price description quantity category size etc.
      form.append('name', title);
      form.append('price', String(data.price || '0'));
      form.append('description', data.description || '');
      form.append('quantity', String(data.quantity ?? 100));
  form.append('category', data.category || 'tops');
      form.append('top_notes', data.top_notes || '');
      form.append('heart_notes', data.heart_notes || '');
      form.append('base_notes', data.base_notes || '');
      if (file) form.append('photo', file);

      if (editingId) {
        form.append('id', String(editingId));
        console.debug('Submitting update product, auth token preview:', token ? `${String(token).slice(0,8)}...` : 'MISSING');
        try {
          const preview = {};
          for (const [k, v] of form.entries()) {
            preview[k] = v && v.name ? `[File: ${v.name}]` : v;
          }
          console.debug('FormData preview (update):', preview);
        } catch (e) {
          // ignore preview errors
        }
        await ApiClient.adminUpdatePerfume(form, token);
      } else {
        console.debug('Submitting new product, auth token preview:', token ? `${String(token).slice(0,8)}...` : 'MISSING');
        try {
          const preview = {};
          for (const [k, v] of form.entries()) {
            preview[k] = v && v.name ? `[File: ${v.name}]` : v;
          }
          console.debug('FormData preview (create):', preview);
        } catch (e) {
          // ignore preview errors
        }
        await ApiClient.adminAddPerfume(form, token);
      }

      // reload list
      const res = await ApiClient.adminGetPerfumes(token);
      if (res && res.perfumes) setProducts(res.perfumes);

      // Notify other tabs/clients that products have changed
      try {
        localStorage.setItem('products:updated', String(Date.now()));
      } catch (e) {
        // ignore storage errors
      }

  reset({ title: "", price: "", image: "", description: "", quantity: 100, category: 'tops', top_notes: '', heart_notes: '', base_notes: '' });
      setEditingId(null);
      setFile(null);
    } catch (err) {
      // Better debug output: show status and server response body when available
      try {
        // Print detailed server response if available (stringify objects for readable output)
        console.error('Error saving product', err, 'status:', err?.status, 'data:', err?.data && typeof err.data === 'object' ? JSON.stringify(err.data, null, 2) : err?.data);
      } catch (logErr) {
        console.error('Error saving product (failed to read error details)', err);
      }

      // Try to extract a server message if provided
      const serverMessage = (err && err.data && (err.data.message || err.data.error || err.data)) || err.message;

      // For debugging: if we have FormData, create a small dump to inspect what was sent
      try {
        if (typeof form !== 'undefined' && form instanceof FormData) {
          const dump = {};
          for (const pair of form.entries()) {
            const [k, v] = pair;
            dump[k] = v && v.name ? `[File: ${v.name}]` : v;
          }
          console.debug('FormData sent (preview):', dump);
        }
      } catch (fdErr) {
        // ignore
      }

      alert(serverMessage || 'Failed to save product. See console for details.');
    }
  };

  const handleEdit = (product) => {
    reset({ title: product.name || product.title, price: product.price, image: '', description: product.description });
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
      reset({ title: "", price: "", image: "", description: "", quantity: 100, category: 'tops', top_notes: '', heart_notes: '', base_notes: '' });
      setEditingId(null);
    }
    } catch (err) {
  console.error('Error deleting product', err);
  alert(err.message || 'Failed to delete product');
    }
  };

  const handleClearAll = () => {
    // removed Clear All action per admin UI request
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
                  <Input placeholder="Title" {...field} />
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
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Price" {...field} />
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
                  <Input type="number" placeholder="Quantity" {...field} />
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

          {/* Size option removed as requested */}

          <FormField
            control={control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL (optional) or upload</FormLabel>
                <FormControl>
                  <Input placeholder="Image URL (optional)" {...field} />
                </FormControl>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files && e.target.files[0])}
                  />
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
                  <Textarea rows={3} placeholder="Description" {...field} />
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
                  <Input placeholder="Comma separated top notes" {...field} />
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
                  <Input placeholder="Comma separated heart notes" {...field} />
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
                  <Input placeholder="Comma separated base notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <Button type="submit">{editingId ? "Update Product" : "Create Product"}</Button>
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
            <img
              src={p.photo_url || p.image || "https://via.placeholder.com/80"}
              alt={p.name || p.title}
              style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{p.name || p.title}</div>
              <div style={{ color: "#6b7280" }}>{p.description}</div>
              <div style={{ marginTop: 6 }}>₹{Number(p.price || p.price === 0 ? p.price : 0).toFixed(2)}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
    <Footer />
    </div>
  );
}
