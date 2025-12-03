import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/auth/login.css";
import Logo from "../../assets/logo.png";
import Avatar from "../../assets/avatars/alex.png";

export default function Auth({ mode = "login" }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();

  // state for API-backed form
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [password2, setPassword2] = useState("");
  const [err, setErr]             = useState("");
  const [loading, setLoading]     = useState(false);

  // --- minimal hashing (client-side) ---
  async function sha256Hex(input) {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(input)
    );
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function hashPassword(identity, pw) {
    return sha256Hex(`${identity}:${pw}`); // simple salt = identity
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    // basic field validation
    // shared rule: password length must be >= 8 chars
    const pwTooShort = !password || password.length < 8;

    if (isLogin) {
      // LOGIN VALIDATION
      if (pwTooShort) {
        setErr("Password must be at least 8 characters.");
        return;
      }
      if (!username) {
        setErr("Please enter username.");
        return;
      }
    } else {
      // SIGNUP VALIDATION
      if (!username) {
        setErr("Username is required.");
        return;
      }
      if (pwTooShort) {
        setErr("Password must be at least 8 characters.");
        return;
      }
      if (!password2 || password2.length < 8) {
        setErr("Please confirm your password (min 8 characters).");
        return;
      }
      if (password !== password2) {
        setErr("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      // TODO: set your backend base URL and endpoints
      const url = isLogin
        ? "http://localhost:4000/user/login"
        : "http://localhost:4000/user/signup";

      const identity = username;
      const hashed = await hashPassword(identity, password);

      const body = isLogin
        ? { username: identity, password: hashed }
        : { username, password: hashed, type: "student" };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Request failed");
      console.log(data);
      if (typeof data?.id !== "number")
        throw new Error("No id in response");

      // store essentials
      localStorage.setItem("uid", String(data.id));
      localStorage.setItem("username", String(identity));

      // route by role
      if (String(data.type) === "student") {
        navigate("/student-dashboard", { replace: true });
      } else {
        navigate("/educator-dashboard", { replace: true });
      }
    } catch (e2) {
      setErr(e2.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pa-wrap">
      <div className={`pa-shell ${isLogin ? "login" : "signup"}`}>
        {/* LEFT */}
        <div className="pa-left">
          <header className="pa-brand">
            <GetLogo />
            <h1>PersonAI</h1>
          </header>

          <main className="pa-main">
            <h2 className="pa-title">
              {isLogin ? "Login to PersonAI" : "Sign-up for PersonAI"}
            </h2>

            {isLogin && (
              <p className="pa-sub">
                Step into your role. Experience project management through
                personas and scenarios.
              </p>
            )}

            {/* wrap original inputs in a form to wire API */}
            <form onSubmit={onSubmit} noValidate>
              <LabeledInput
                label="Username"
                placeholder="Enter your username"
                value={username}
                onChange={setUsername}
              />

              <LabeledInput
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={setPassword}
              />

              {!isLogin && (
                <LabeledInput
                  label="Re-enter Password"
                  type="password"
                  placeholder="Enter your password again"
                  value={password2}
                  onChange={setPassword2}
                />
              )}

              {err ? (
                <div className="pa-error" role="alert">
                  {err}
                </div>
              ) : null}

              <button className="pa-cta" type="submit" disabled={loading}>
                {loading
                  ? isLogin
                    ? "Logging in..."
                    : "Signing up..."
                  : isLogin
                    ? "Log In"
                    : "Sign Up"}
              </button>
            </form>

            <div className="pa-meta">
              {isLogin ? (
                <>
                  Don’t have an account?{" "}
                  <Link to="/signup">Sign up here</Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link to="/">Log in here</Link>
                </>
              )}
            </div>
          </main>
        </div>

        {/* RIGHT */}
        <div className="pa-right">
          <div className="pa-hero">
            <PersonaStack
              name="ALEX CHEN"
              role="Risk Manager"
              badgeSrc={Avatar}
            />
            <div className="pa-hero-copy">
              <div className="pa-hero-h1">
                {isLogin ? "Learn with diverse" : "Meet your"}
              </div>
              <div className="pa-hero-h2">AI teammates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// keep original styled input, but make it controlled
function LabeledInput({ label, placeholder, type = "text", value, onChange }) {
  return (
    <label className="pa-field">
      <span className="pa-label">{label}</span>
      <input
        className="pa-input"
        type={type}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        required
      />
    </label>
  );
}

function GetLogo() {
  return (
    <div className="pa-logo" aria-hidden>
      <img
        src={Logo}
        alt="App Logo"
        style={{ width: 44, height: 44, objectFit: "contain" }}
      />
    </div>
  );
}

function PersonaStack({ name = "ALEX CHEN", role = "Risk Manager", badgeSrc }) {
  return (
    <div className="persona-stack" aria-label={`${name} persona card`}>
      <div className="ps-card ps-card-1" />
      <div className="ps-card ps-card-2" />
      <div className="ps-card ps-card-3" />
      <div className="ps-card ps-card-4" />
      <div className="ps-name">{name}</div>
      <div className="ps-role">{role}</div>
      {badgeSrc ? <img className="ps-badge" src={badgeSrc} alt="" /> : null}
      <div className="ps-tag">PERSONA</div>
    </div>
  );
}
