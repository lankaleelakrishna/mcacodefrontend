import React, { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (user && user.isAdmin) {
    return <Navigate to="/admin/products" replace />;
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

    try {
      const endpoint = `${API_BASE}/admin/login`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Login failed");

      login(data.token);
      // Redirect admin to admin console
      navigate('/admin/products');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#9fbfb0' }}>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">Admin Login</h2>
          {error && <Alert variant="destructive">{error}</Alert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Username</label>
              <input name="username" value={formData.username} onChange={handleChange} required className="mt-1 block w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Password</label>
              <input name="password" type="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full border rounded px-3 py-2" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2 rounded">
              {loading ? <><Loader2 className="inline-block" /> Logging in...</> : 'Log in'}
            </button>
          </form>
          <p className="mt-4 text-sm">Back to <Link to="/">site</Link></p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
