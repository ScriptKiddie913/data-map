"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { supabase } from "../lib/supabase"

const BreachMap = dynamic(() => import("./BreachMap"), { ssr: false })

export default function Home() {
  const [leaks, setLeaks] = useState([])
  const [session, setSession] = useState(null)
  const [form, setForm] = useState({ leak: "", group: "", date: "", data: "", latitude: "", longitude: "" })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ leak: "", group: "", date: "", data: "", latitude: "", longitude: "" })
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
    const pageSize = 1000
    let allData = []
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from("leaks")
        .select("*")
        .order("date", { ascending: false })
        .range(from, from + pageSize - 1)
      if (error) { console.error("fetchLeaks error:", error); break }
      if (!data || data.length === 0) break
      allData = allData.concat(data)
      if (data.length < pageSize) break
      from += pageSize
    }
    setLeaks(allData)
    setLoading(false)
  }

  // Parses a PostGIS geometry/geography column returned by Supabase as hex-encoded EWKB
  function parseLocation(item) {
    const loc = item.location
    if (!loc || typeof loc !== "string") return { lat: null, lng: null }
    try {
      const isLittleEndian = loc.substring(0, 2) === "01"
      const typeBytes = loc.substring(2, 10).match(/../g).map(b => parseInt(b, 16))
      const wkbType = isLittleEndian
        ? (typeBytes[0] | (typeBytes[1] << 8) | (typeBytes[2] << 16) | (typeBytes[3] << 24)) >>> 0
        : ((typeBytes[0] << 24) | (typeBytes[1] << 16) | (typeBytes[2] << 8) | typeBytes[3]) >>> 0
      const xOff = (wkbType & 0x20000000) ? 18 : 10
      const readF64 = (off) => {
        const b = loc.substring(off, off + 16).match(/../g).map(h => parseInt(h, 16))
        if (isLittleEndian) b.reverse()
        return new DataView(new Uint8Array(b).buffer).getFloat64(0)
      }
      return { lng: readF64(xOff), lat: readF64(xOff + 16) }
    } catch {
      return { lat: null, lng: null }
    }
  }

  async function addLeak() {
    if (!form.leak || !form.group) return
    const payload = { leak: form.leak, group: form.group, data: form.data }
    if (form.date) payload.date = new Date(form.date).toISOString()
    const lat = parseFloat(form.latitude)
    const lng = parseFloat(form.longitude)
    if (!isNaN(lat) && !isNaN(lng)) {
      payload.location = `POINT(${lng} ${lat})`
    }
    await supabase.from("leaks").insert([payload])
    setForm({ leak: "", group: "", date: "", data: "", latitude: "", longitude: "" })
    fetchLeaks()
  }

  async function deleteLeak(id) {
    const { error } = await supabase.from("leaks").delete().eq("id", id)
    if (error) {
      console.error("deleteLeak error:", error)
      alert("Failed to delete record: " + error.message)
      return
    }
    await fetchLeaks()
  }

  function startEdit(item) {
    setEditId(item.id)
    const localDate = item.date
      ? new Date(item.date).toISOString().slice(0, 16)
      : ""
    const { lat, lng } = parseLocation(item)
    setEditForm({
      leak: item.leak,
      group: item.group,
      date: localDate,
      data: item.data || "",
      latitude: lat !== null ? String(lat) : "",
      longitude: lng !== null ? String(lng) : "",
    })
  }

  async function saveEdit() {
    const payload = { leak: editForm.leak, group: editForm.group, data: editForm.data }
    payload.date = editForm.date ? new Date(editForm.date).toISOString() : null
    const lat = parseFloat(editForm.latitude)
    const lng = parseFloat(editForm.longitude)
    if (!isNaN(lat) && !isNaN(lng)) {
      payload.location = `POINT(${lng} ${lat})`
    } else {
      payload.location = null
    }
    const { error } = await supabase.from("leaks").update(payload).eq("id", editId)
    if (error) {
      console.error("saveEdit error:", error)
      alert("Failed to update record: " + error.message)
      return
    }
    setEditId(null)
    await fetchLeaks()
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    })
  }

  return (
    <>
      <nav className="top-nav">
        <div className="nav-brand">
          <span className="brand-dot"></span>
          <h1>Data Intelligence Dashboard</h1>
        </div>
        <div className="nav-right">
          <span className="nav-status">
            {session ? session.user.email : "Public — Read Only"}
          </span>
          {!session ? (
            <a href="/login"><button>Sign In</button></a>
          ) : (
            <button className="secondary" onClick={logout}>Sign Out</button>
          )}
        </div>
      </nav>

      <div className="dashboard">
        <div className="page-header">
          <h2>Leak Intelligence</h2>
          <div className="subtitle">
            Monitor and manage threat actor leak records
          </div>
        </div>

        {session && (
          <div className="admin-panel">
            <h3>Add New Record</h3>
            <div className="form-grid">
              <div>
                <label className="form-label">Leak Identifier</label>
                <input
                  placeholder="Enter leak name or identifier"
                  value={form.leak}
                  onChange={(e) => setForm({ ...form, leak: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Group / Threat Actor</label>
                <input
                  placeholder="Enter group or threat actor"
                  value={form.group}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="form-full">
                <label className="form-label">Data Payload</label>
                <textarea
                  placeholder="Additional data or notes"
                  rows={3}
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 22.5726"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 88.3639"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                />
              </div>
            </div>
            <div className="form-actions">
              <button onClick={addLeak}>Add Record</button>
            </div>
          </div>
        )}

        <div className="count-bar">
          {loading ? (
            "Loading records…"
          ) : (
            <>
              <span>Total records</span>
              <span className="count-badge">{leaks.length}</span>
            </>
          )}
        </div>

        <div className="map-section">
          <h3 className="map-heading">Breach Map</h3>
          {!loading && (
            <BreachMap leaks={leaks} parseLocation={parseLocation} />
          )}
        </div>

        <div className="records-table">
          <div className={`table-header${session ? " table-header-auth" : ""}`}>
            <span>Leak</span>
            <span>Group</span>
            <span style={{ textAlign: "right" }}>Timestamp</span>
            <span>Data</span>
            <span>Location</span>
            {session && <span></span>}
          </div>

          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="skeleton-row">
                <div className="skeleton" style={{ width: "30%", marginRight: 16 }} />
                <div className="skeleton" style={{ width: "15%", marginRight: 16 }} />
                <div className="skeleton" style={{ width: "20%", marginRight: 16 }} />
                <div className="skeleton" style={{ flex: 1 }} />
              </div>
            ))
          ) : (
            leaks.map((item) => (
              <div key={item.id}>
                <div className={`table-row${session ? " table-row-auth" : ""}`}>
                  <span className="row-leak">{item.leak}</span>
                  <span className="row-group">
                    <span className="group-badge">{item.group}</span>
                  </span>
                  <span className="row-date">{formatDate(item.date)}</span>
                  <span className="row-data">{item.data || <span style={{ color: "#7b8a9a", fontStyle: "italic" }}>—</span>}</span>
                  <span className="row-location">
                    {(() => {
                      const { lat, lng } = parseLocation(item)
                      return lat !== null
                        ? <span style={{ fontFamily: "monospace", fontSize: "0.85em" }}>{lat}, {lng}</span>
                        : <span style={{ color: "#7b8a9a", fontStyle: "italic" }}>—</span>
                    })()}
                  </span>
                  {session && (
                    <span className="row-actions">
                      <button className="warn" onClick={() => startEdit(item)}>Edit</button>
                      <button className="danger" onClick={() => deleteLeak(item.id)}>Delete</button>
                    </span>
                  )}
                </div>

                {session && editId === item.id && (
                  <div style={{ padding: "0 20px 20px" }}>
                    <div className="edit-form">
                      <div>
                        <label className="form-label">Leak</label>
                        <input
                          value={editForm.leak}
                          placeholder="Leak identifier"
                          onChange={(e) => setEditForm({ ...editForm, leak: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="form-label">Group</label>
                        <input
                          value={editForm.group}
                          placeholder="Group"
                          onChange={(e) => setEditForm({ ...editForm, group: e.target.value })}
                        />
                      </div>
                      <div className="edit-full">
                        <label className="form-label">Date &amp; Time</label>
                        <input
                          type="datetime-local"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        />
                      </div>
                      <div className="edit-full">
                        <label className="form-label">Data</label>
                        <textarea
                          rows={3}
                          value={editForm.data}
                          placeholder="Data payload"
                          onChange={(e) => setEditForm({ ...editForm, data: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="form-label">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={editForm.latitude}
                          placeholder="e.g. 22.5726"
                          onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="form-label">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={editForm.longitude}
                          placeholder="e.g. 88.3639"
                          onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                        />
                      </div>
                      <div className="edit-actions">
                        <button className="warn" onClick={saveEdit}>Save</button>
                        <button className="secondary" onClick={() => setEditId(null)}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
