import React, { useState } from "react";


const emailOrUsernameRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$|^[a-zA-Z0-9_-]{3,30}$/;

export default function LoginForm({ apiBase = "" }) {
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  function validate() {
    const next = {};
    if (!identity.trim()) next.identity = "Enter email or username.";
    else if (!emailOrUsernameRegex.test(identity)) next.identity = "Enter a valid email or username.";
    if (!password) next.password = "Enter your password.";
    return next;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:6001/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessage({ type: "success", text: data.message || "Logged in." });
      // optionally store token: localStorage.setItem("token", data.token)
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Login failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h2>Login</h2>

      {message && (
        <div role="alert" className={message.type === "error" ? "auth-msg error" : "auth-msg success"}>
          {message.text}
        </div>
      )}

      <label>
        Email or Username
        <input
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          aria-invalid={!!errors.identity}
          aria-describedby={errors.identity ? "id-error" : undefined}
          required
        />
      </label>
      {errors.identity && (
        <div id="id-error" role="alert" className="field-error">
          {errors.identity}
        </div>
      )}

      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "pw-error" : undefined}
          required
        />
      </label>
      {errors.password && (
        <div id="pw-error" role="alert" className="field-error">
          {errors.password}
        </div>
      )}

      <div className="form-row">
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </form>
  );
}
