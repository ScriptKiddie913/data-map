"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import "./globals.css"

export default function Home() {
  const [leaks, setLeaks] = useState([])
  const [session, setSession] = useState(null)
  const [form, setForm] = useState({ leak: "", group: "", data: "" })

  useEffect(() => {
    fetchLeaks()
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
  }, [])

  async function fetchLeaks() {
    const { data } = await supabase
      .from("leaks")
      .select("*")
      .order("date", { ascending: false })
    setLeaks(data)
  }

  async function addLeak() {
    await supabase.from("leaks").insert([form])
    fetchLeaks()
  }

  async function deleteLeak(id) {
    await supabase.from("leaks").delete().eq("id", id)
    fetchLeaks()
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>☠ CYBER LEAK MONITOR ☠</h1>

      {!session && (
        <a href="/login">
          <button>Admin Login</button>
        </a>
      )}

      {session && (
        <>
          <input
            placeholder="Leak"
            onChange={(e) => setForm({ ...form, leak: e.target.value })}
          />
          <input
            placeholder="Group"
            onChange={(e) => setForm({ ...form, group: e.target.value })}
          />
          <input
            placeholder="Data"
            onChange={(e) => setForm({ ...form, data: e.target.value })}
          />
          <button onClick={addLeak}>Inject</button>
        </>
      )}

      <hr />

      {leaks?.map((item) => (
        <div key={item.id} className="card">
          <p>Leak: {item.leak}</p>
          <p>Group: {item.group}</p>
          <p>Date: {item.date}</p>
          <p>Data: {item.data}</p>

          {session && (
            <button onClick={() => deleteLeak(item.id)}>
              Purge
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
