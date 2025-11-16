import React, { useState } from 'react';

//for validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;


/*
Function to validate password strength
@param {string} pw - The password to validate
@return {Object} - An object with boolean properties indicating which 
    criteria are met
*/
function validatePassword(pw) {
    const lengthOk = pw.length >= 8;
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSymbol =  /[^\w\s]/.test(pw);
    return {lengthOk, hasUpper, hasLower, hasNumber, hasSymbol};
}

export default function RegistrationForm({apiBase = ""}) {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    function runValidation() {
        const next = {};
        if (!emailRegex.test(email)) next.email = "Enter a valid email.";
        if (!usernameRegex.test(username))
          next.username = "Username must be 3-20 characters, letters/numbers/_/- only.";
        const pw = validatePassword(password);
        if (!pw.lengthOk) next.password = "Password must be at least 8 characters.";
        if (!pw.hasUpper || !pw.hasLower || !pw.hasNumber)
          next.password =
            (next.password ? next.password + " " : "") +
            "Use upper, lower and numbers for stronger password.";
        if (password !== confirm) next.confirm = "Passwords do not match.";
        return next;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        const nextErrors = runValidation();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        
        setSubmitting(true);
        try {
            // MUST CHANGE TO ACTUAL API ENDPOINT
            const res = await fetch(`${apiBase}/api/register`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email, username, password}),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `HTTP ${res.status}`);
            }
            const data = await res.json();
            setMessage({ type: "success", text: data.message || "Registered successfully." });
            setEmail("");
            setUsername("");
            setPassword("");
            setConfirm("");
            setErrors({});
        } catch (err) {
            setMessage({ type: "error", text: err.message || "Registration failed." });
        } finally {
            setSubmitting(false);
        }
    };

    const pwState = validatePassword(password);

    return (
        <form className = "auth-form" onSubmit={handleSubmit} noValidate>
            <h2>Register</h2>

            {message && (
                <div 
                    role="alert"
                    className={message.type === "error" ? "auth-msg error" : "auth-msg success"}
                >
                    {message.text}
                </div>
            )}

            <label>
                Email
                <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    required
                />
            </label>

            {errors.email && ( 
                <div id="email-error" role="alert" className="field-error">
                    {errors.email}
                </div>
            )}
            <label>
                Username
                <input
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    aria-invalid={!!errors.username}
                    aria-describedby={errors.username ? "username-error" : undefined}
                    required
                />
            </label>
            {errors.username && ( 
                <div id="username-error" role="alert" className="field-error">
                    {errors.username}
                </div>
            )}
            <label>
                Password
                <input
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : "password-hint"}
                    required
                />
            </label>
            {errors.password && ( 
                <div id="password-error" role="alert" className="field-error">
                    {errors.password}
                </div>
            )}
            <div id ="password-hint" className="pw-hint">
                <small>Password must be ≥ 8 characters and include upper/lower/number (symbol optional). </small>
                <div className="pw-checks">
                    <div className={pwState.lengthOk ? "ok" : "bad"}>≥ 8 chars</div>
                    <div className={pwState.hasUpper ? "ok" : "bad"}>Uppercase</div>
                    <div className={pwState.hasLower ? "ok" : "bad"}>Lowercase</div>
                    <div className={pwState.hasNumber ? "ok" : "bad"}>Number</div>
                </div>
            </div>
            <label>
                Confirm Password
                <input
                    name="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    aria-invalid={!!errors.confirm}
                    aria-describedby={errors.confirm ? "confirm-error" : undefined}
                    required
                />
            </label>
            {errors.confirm && ( 
                <div id="confirm-error" role="alert" className="field-error">
                    {errors.confirm}
                </div>
            )}

            <div className="form-row">
                <button type="submit" disabled={submitting}>
                    {submitting ? "Registering..." : "Register"}
                </button>
            </div>
        </form>    
    );
}

