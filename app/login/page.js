"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error) router.push("/")
    else alert("Access Denied")
  }

  return (
    <div style={{ padding: 50 }}>
      <h1>☠ ADMIN ACCESS TERMINAL ☠</h1>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={login}>Authenticate</button>
    </div>
  )
}
