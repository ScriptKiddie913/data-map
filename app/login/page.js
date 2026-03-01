"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  async function login() {
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) router.push("/")
    else setError("Invalid email or password. Please try again.")
  }

  function handleKey(e) {
    if (e.key === "Enter") login()
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">🔐</div>
        <h1>Welcome back</h1>
        <div className="sub">Sign in to access the intelligence dashboard</div>

        <div className="login-field">
          <label>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="username"
          />
        </div>

        <div className="login-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="current-password"
          />
        </div>

        <button onClick={login}>Sign In</button>

        {error && <div className="error-msg">{error}</div>}
      </div>
    </div>
  )
}
