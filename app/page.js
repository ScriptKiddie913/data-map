"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function Home() {
  const [leaks, setLeaks] = useState([])
  const [session, setSession] = useState(null)
  const [form, setForm] = useState({ leak: "", group: "", data: "" })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ leak: "", group: "", data: "" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaks()
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchLeaks() {
    setLoading(true)
    const { data } = await supabase
      .from("leaks")
      .select("*")
      .order("date", { ascending: false })
    setLeaks(data || [])
    setLoading(false)
  }

  async function addLeak() {
    if (!form.leak || !form.group) return
    await supabase.from("leaks").insert([form])
    setForm({ leak: "", group: "", data: "" })
    fetchLeaks()
  }

  async function deleteLeak(id) {
    await supabase.from("leaks").delete().eq("id", id)
    fetchLeaks()
  }

  function startEdit(item) {
    setEditId(item.id)
    setEditForm({ leak: item.leak, group: item.group, data: item.data || "" })
  }

  async function saveEdit() {
    await supabase.from("leaks").update(editForm).eq("id", editId)
    setEditId(null)
    fetchLeaks()
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="terminal">
      <div className="header">
        <h1>[ CYBER LEAK MONITOR ]</h1>
        <div className="subtitle">INTELLIGENCE TERMINAL v2.0 // CLASSIFIED</div>
      </div>

      <div className="nav-bar">
        <div>
          <span className="status-dot"></span>
          <span style={{ fontSize: "0.8rem", letterSpacing: 2 }}>
            {session
              ? `AUTHENTICATED :: ${session.user.email}`
              : "PUBLIC NODE // READ-ONLY ACCESS"}
          </span>
        </div>
        <div>
          {!session ? (
            <a href="/login"><button>[ ADMIN ACCESS ]</button></a>
          ) : (
            <button className="danger" onClick={logout}>[ DISCONNECT ]</button>
          )}
        </div>
      </div>

      {session && (
        <div className="admin-panel">
          <h2>// INJECT NEW RECORD</h2>
          <div className="form-grid">
            <input
              placeholder="LEAK IDENTIFIER"
              value={form.leak}
              onChange={(e) => setForm({ ...form, leak: e.target.value })}
            />
            <input
              placeholder="GROUP / THREAT ACTOR"
              value={form.group}
              onChange={(e) => setForm({ ...form, group: e.target.value })}
            />
            <textarea
              className="form-full"
              placeholder="DATA PAYLOAD"
              rows={3}
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button onClick={addLeak}>[ INJECT RECORD ]</button>
          </div>
        </div>
      )}

      <div className="count-bar">
        {loading
          ? "// LOADING INTELLIGENCE DATABASE..."
          : `// ${leaks.length} RECORD(S) INDEXED`}
      </div>

      {leaks.map((item) => (
        <div key={item.id} className="card">
          <div className="card-header">
            <span className="leak-name">{item.leak}</span>
            <span className="group-tag">{item.group}</span>
          </div>
          <div className="card-meta">
            TIMESTAMP: {new Date(item.date).toLocaleString()} &nbsp;|&nbsp; ID: {item.id}
          </div>
          {item.data && <div className="card-data">{item.data}</div>}

          {session && editId === item.id && (
            <div className="edit-form">
              <input
                value={editForm.leak}
                placeholder="LEAK"
                onChange={(e) => setEditForm({ ...editForm, leak: e.target.value })}
              />
              <input
                value={editForm.group}
                placeholder="GROUP"
                onChange={(e) => setEditForm({ ...editForm, group: e.target.value })}
              />
              <textarea
                className="edit-full"
                rows={3}
                value={editForm.data}
                placeholder="DATA"
                onChange={(e) => setEditForm({ ...editForm, data: e.target.value })}
              />
              <div className="edit-actions">
                <button className="warn" onClick={saveEdit}>[ SAVE ]</button>
                <button onClick={() => setEditId(null)}>[ CANCEL ]</button>
              </div>
            </div>
          )}

          {session && (
            <div className="card-actions">
              <button className="warn" onClick={() => startEdit(item)}>[ EDIT ]</button>
              <button className="danger" onClick={() => deleteLeak(item.id)}>[ PURGE ]</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
