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
    else setError("// ACCESS DENIED: INVALID CREDENTIALS")
  }

  function handleKey(e) {
    if (e.key === "Enter") login()
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <h1>☠ ADMIN ACCESS TERMINAL ☠</h1>
        <div className="sub">AUTHORIZED PERSONNEL ONLY</div>

        <input
          placeholder="USER IDENTIFIER"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKey}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="ACCESS CODE"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKey}
          autoComplete="current-password"
        />

        <button onClick={login}>[ AUTHENTICATE ]</button>

        {error && <div className="error-msg">{error}</div>}
      </div>
    </div>
  )
}
