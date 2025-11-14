import React, { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.tsx";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

    try {
      const endpoint = `${API_BASE}/${role}/login`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Login failed");

      login(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa", // --neutral-light
      }}
    >
      <Navbar />

      {/* Main content with centered modal */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 1rem",
          backgroundImage:
            "url('https://images.unsplash.com/photo-1615529182904-56c5271b22a9?auto=format&fit=crop&w=1950&q=80')", // Perfume-themed background
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        {/* Overlay for contrast */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #1a5f3a70, #2d8c4a70)", // Royal green gradient overlay
          }}
        ></div>

        {/* Modal */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: "28rem", // max-w-md
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "1rem",
            boxShadow: "0 10px 30px rgba(26, 95, 58, 0.2)",
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
              style={{
                width: "6rem",
                height: "6rem",
                margin: "0 auto 1rem",
                objectFit: "contain",
                borderRadius: "50%",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                transition: "transform 0.5s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(12deg)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "rotate(0deg)")}
            />
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.875rem", // text-3xl
                fontWeight: 800,
                color: "#1a5f3a", // --primary-green
              }}
            >
              Welcome to MCA Fashion
            </h1>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.875rem", // text-sm
                color: "#7f8c8d", // --text-light
                marginTop: "0.5rem",
              }}
            >
              Log in to explore our world of women's designer wear
            </p>
          </div>

          {error && (
            <Alert
              variant="destructive"
              style={{
                marginBottom: "1.5rem",
                fontSize: "0.875rem",
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fee2e2",
                padding: "0.75rem",
                borderRadius: "0.375rem",
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#1a5f3a",
                  marginBottom: "0.5rem",
                }}
              >
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  border: "1px solid rgba(45, 140, 74, 0.3)", // --secondary-green/30
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  color: "#2c3e50", // --neutral-dark
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#d4a017";
                  e.target.style.boxShadow = "0 0 0 2px #d4a01740";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(45, 140, 74, 0.3)";
                  e.target.style.boxShadow = "none";
                }}
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#1a5f3a",
                  marginBottom: "0.5rem",
                }}
              >
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  border: "1px solid rgba(45, 140, 74, 0.3)",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  color: "#2c3e50",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
                placeholder="Enter your username"
                onFocus={(e) => {
                  e.target.style.borderColor = "#d4a017";
                  e.target.style.boxShadow = "0 0 0 2px #d4a01740";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(45, 140, 74, 0.3)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#1a5f3a",
                  marginBottom: "0.5rem",
                }}
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  border: "1px solid rgba(45, 140, 74, 0.3)",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  color: "#2c3e50",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
                placeholder="Enter your password"
                onFocus={(e) => {
                  e.target.style.borderColor = "#d4a017";
                  e.target.style.boxShadow = "0 0 0 2px #d4a01740";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(45, 140, 74, 0.3)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                backgroundColor: "#d4a017", // --gold-primary
                color: "#1a5f3a", // --primary-green
                fontWeight: 600,
                padding: "0.75rem",
                fontSize: "0.875rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(212, 160, 23, 0.3)",
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "#f5c518"; // --gold-secondary
                  e.currentTarget.style.transform = "scale(1.02)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "#d4a017";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.875rem",
                color: "#7f8c8d",
              }}
            >
              Don’t have an account?{" "}
              <Link
                to="/signup"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{
                  fontWeight: 500,
                  color: "#d4a017",
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f5c518")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#d4a017")}
              >
                Sign up
              </Link>
            </p>
            <div style={{ marginTop: "1rem" }}>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.875rem",
                  color: "#7f8c8d",
                  marginBottom: "0.5rem",
                }}
              >
                Or log in with
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
                <button
                  style={{
                    padding: "0.5rem",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#d4a017";
                    e.currentTarget.style.color = "#1a5f3a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                    e.currentTarget.style.color = "inherit";
                  }}
                >
                  <i className="fab fa-google" style={{ fontSize: "1.125rem" }}></i>
                </button>
                <button
                  style={{
                    padding: "0.5rem",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#d4a017";
                    e.currentTarget.style.color = "#1a5f3a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                    e.currentTarget.style.color = "inherit";
                  }}
                >
                  <i className="fab fa-facebook-f" style={{ fontSize: "1.125rem" }}></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Global styles for fonts and keyframe animations - use plain <style> to avoid styled-jsx props */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');

        :root {
          --primary-green: #1a5f3a;
          --secondary-green: #2d8c4a;
          --accent-green: #4caf50;
          --gold-primary: #d4a017;
          --gold-secondary: #f5c518;
          --neutral-dark: #2c3e50;
          --neutral-light: #f8f9fa;
          --text-light: #7f8c8d;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}