# Data Intelligence Dashboard

A Next.js + Supabase dashboard for managing and visualising leak intelligence records, with PostGIS geolocation support.

---

## PostGIS Setup (Supabase)

### 1. Enable the PostGIS extension

Run this once in the Supabase SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 2. Add the location column to the `leaks` table

```sql
ALTER TABLE leaks
ADD COLUMN location geography(Point, 4326);
```

### 3. Insert a record with a location (example)

```sql
INSERT INTO leaks (leak, "group", data, location)
VALUES (
  'Test',
  'Group A',
  'Sample data',
  ST_SetSRID(ST_MakePoint(88.3639, 22.5726), 4326)
);
```

> Note: `ST_MakePoint(longitude, latitude)` — longitude comes **first**.

---

## How the Dashboard Uses Location Data

When fetching records the dashboard requests the location as GeoJSON so it can display the latitude and longitude:

```js
const { data } = await supabase
  .from("leaks")
  .select("*, ST_AsGeoJSON(location) as location_geojson")
  .order("date", { ascending: false })
```

When inserting or updating a record the dashboard sends the location as a WKT string which PostGIS converts automatically:

```js
payload.location = `POINT(${longitude} ${latitude})`
```

---

## Fetching Data in Another Site & Showing on a Map

### Step 1 — Fetch the data from Supabase

Install the Supabase JS client in your other project:

```bash
npm install @supabase/supabase-js
```

Create a Supabase client and fetch all leak records with their coordinates:

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://<your-project-ref>.supabase.co',
  '<your-anon-key>'
)

async function fetchLeaksWithLocation() {
  const { data, error } = await supabase
    .from('leaks')
    .select('id, leak, "group", date, data, ST_AsGeoJSON(location) as location_geojson')

  if (error) {
    console.error(error)
    return []
  }

  // Parse the GeoJSON string into usable lat/lng values
  return data.map((item) => {
    let lat = null, lng = null
    if (item.location_geojson) {
      const geo = typeof item.location_geojson === 'string'
        ? JSON.parse(item.location_geojson)
        : item.location_geojson
      lng = geo.coordinates[0]
      lat = geo.coordinates[1]
    }
    return { ...item, lat, lng }
  })
}
```

### Step 2 — Display on a map with Leaflet

Install Leaflet:

```bash
npm install leaflet react-leaflet   # React
# or just leaflet for vanilla JS
```

#### React example (`MapView.jsx`)

```jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import { fetchLeaksWithLocation } from './supabaseClient'

// Fix default marker icon for webpack/Next.js
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapView() {
  const [leaks, setLeaks] = useState([])

  useEffect(() => {
    fetchLeaksWithLocation().then(setLeaks)
  }, [])

  return (
    <MapContainer center={[20, 0]} zoom={2} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {leaks
        .filter((item) => item.lat !== null && item.lng !== null)
        .map((item) => (
          <Marker key={item.id} position={[item.lat, item.lng]}>
            <Popup>
              <strong>{item.leak}</strong><br />
              Group: {item.group}<br />
              {item.data && <span>Data: {item.data}<br /></span>}
              Lat: {item.lat}, Lng: {item.lng}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  )
}
```

#### Alternative: Mapbox GL JS (vanilla JS)

```html
<link href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
<script src="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"></script>
<div id="map" style="height:100vh"></div>
<script type="module">
  import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js'

  const supabase = createClient('https://<ref>.supabase.co', '<anon-key>')

  mapboxgl.accessToken = '<your-mapbox-token>'
  const map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/dark-v11', zoom: 2, center: [0, 20] })

  map.on('load', async () => {
    const { data } = await supabase
      .from('leaks')
      .select('id, leak, "group", data, ST_AsGeoJSON(location) as location_geojson')

    const features = (data || [])
      .filter((r) => r.location_geojson)
      .map((r) => {
        const geo = typeof r.location_geojson === 'string'
          ? JSON.parse(r.location_geojson)
          : r.location_geojson
        return {
          type: 'Feature',
          geometry: geo,
          properties: { id: r.id, leak: r.leak, group: r.group, data: r.data },
        }
      })

    map.addSource('leaks', { type: 'geojson', data: { type: 'FeatureCollection', features } })

    map.addLayer({
      id: 'leaks-circles',
      type: 'circle',
      source: 'leaks',
      paint: { 'circle-radius': 8, 'circle-color': '#e74c3c', 'circle-opacity': 0.85 },
    })
  })
</script>
```

---

## Supabase Row-Level Security (RLS) Note

Make sure your `leaks` table has an RLS policy that allows public `SELECT` if you want the map on the other site to be publicly accessible without authentication:

```sql
CREATE POLICY "Allow public read"
  ON leaks FOR SELECT
  USING (true);
```

---

## Environment Variables

Keep your Supabase credentials in `.env.local` (never commit them):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Then use them in code:

```js
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```
