import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.tsx";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
  });
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-focus first input
  useEffect(() => {
    document.getElementById("username")?.focus();
  }, []);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match!");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        password: formData.password,
        confirm_password: formData.confirm_password,
      };

      const response = await fetch(`${API_BASE}/${role}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to create account");

      navigate("/login", { state: { message: "Account created! Please log in." } });
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar />

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 1rem",
          backgroundImage: "url('https://images.unsplash.com/photo-1615529182904-56c5271b22a9?auto=format&fit=crop&w=1950&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a5f3a70, #2d8c4a70)" }} />

        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: "32rem",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "1rem",
            boxShadow: "0 10px 30px rgba(26,95,58,0.2)",
            padding: "2rem",
            transform: "scale(1)",
            transition: "transform 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <img
              src="/logo.jpg"
              alt="MCA Fashion Logo"
              style={{ width: "6rem", height: "6rem", margin: "0 auto 1rem", objectFit: "contain", borderRadius: "50%", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transition: "transform 0.4s" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(8deg)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "rotate(0deg)")}
            />
            <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#1a5f3a" }}>Create Your Account</h1>
            <p style={{ fontSize: "0.875rem", color: "#7f8c8d", marginTop: "0.5rem" }}>Join MCA Fashion's world of women's designer wear</p>
          </div>

          {error && (
            <Alert variant="destructive" style={{ marginBottom: "1rem" }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#1a5f3a", marginBottom: "0.5rem" }}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} disabled={loading} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(45,140,74,0.2)" }}>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#1a5f3a", marginBottom: "0.5rem" }}>Username</label>
              <input id="username" type="text" name="username" value={formData.username} onChange={handleChange} required disabled={loading} placeholder="johndoe" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(45,140,74,0.2)" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#1a5f3a", marginBottom: "0.5rem" }}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={loading} placeholder="you@example.com" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(45,140,74,0.2)" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#1a5f3a", marginBottom: "0.5rem" }}>Phone Number</label>
              <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} required disabled={loading} placeholder="+1 234 567 8900" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(45,140,74,0.2)" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#1a5f3a", marginBottom: "0.5rem" }}>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required disabled={loading} placeholder="••••••••" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(45,140,74,0.2)" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#1a5f3a", marginBottom: "0.5rem" }}>Confirm Password</label>
              <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required disabled={loading} placeholder="••••••••" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(45,140,74,0.2)" }} />
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", backgroundColor: "#d4a017", color: "#1a5f3a", fontWeight: 600, padding: "0.75rem", fontSize: "0.875rem", borderRadius: "0.5rem", border: "none", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: "0 4px 15px rgba(212,160,23,0.25)" }} onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = "#f5c518"; e.currentTarget.style.transform = "scale(1.02)"; } }} onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = "#d4a017"; e.currentTarget.style.transform = "scale(1)"; } }}>
              {loading ? (
                <>
                  <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                  <span>Creating Account...</span>
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: "#7f8c8d" }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{ fontWeight: 500, color: "#d4a017", textDecoration: "none" }}
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}