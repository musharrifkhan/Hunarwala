
import { useState } from "react";
import { X, Eye, EyeOff, ArrowRight, UserRound } from "lucide-react";
import { signupUser, loginUser } from "./api";
import "./AuthModal.css";

export default function AuthModal({ onClose, onLogin }) {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
  });

  const updateField = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signup") {
        await signupUser({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          password: form.password,
        });

        setSuccess("Account created! You can now log in.");
        setMode("login");
        setForm((prev) => ({ ...prev, password: "" }));
      } else {
        const data = await loginUser({
          phone: form.phone.trim(),
          password: form.password,
        });

        localStorage.setItem("hunarwala-token", data.access_token);
        localStorage.setItem("hunarwala-user", JSON.stringify(data.user));

        onLogin(data.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        className="auth-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="auth-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-brand">
          <span className="auth-logo">h</span>
          <span>hunarwala<span className="auth-dot">.</span></span>
        </div>

        <div className="auth-heading">
          <div className="auth-icon">
            <UserRound size={22} />
          </div>
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p>
            {mode === "login"
              ? "Sign in to manage your bookings."
              : "Join Hunarwala and get things done."}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
              setSuccess("");
            }}
          >
            Log in
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMode("signup");
              setError("");
              setSuccess("");
            }}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <label>
              Full name
              <input
                name="full_name"
                value={form.full_name}
                onChange={updateField}
                placeholder="Your full name"
                required
                minLength={2}
              />
            </label>
          )}

          <label>
            Phone number
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={updateField}
              placeholder="10-digit phone number"
              required
              minLength={10}
              maxLength={15}
            />
          </label>

          {mode === "signup" && (
            <label>
              Email <span className="auth-optional">Optional</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="you@example.com"
              />
            </label>
          )}

          <label>
            Password
            <div className="auth-password">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={updateField}
                placeholder="At least 8 characters"
                required
                minLength={8}
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error && <div className="auth-message error">{error}</div>}
          {success && <div className="auth-message success">{success}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Log in"
              : "Create account"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-footer">
          By continuing, you agree to Hunarwala's terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
