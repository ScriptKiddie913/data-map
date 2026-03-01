"use client"

import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

// Fix Leaflet default icon paths broken by webpack bundling
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
})

export default function BreachMap({ leaks, parseLocation }) {
  const mapped = leaks
    .map((item) => ({ item, ...parseLocation(item) }))
    .filter(({ lat, lng }) => lat !== null && lng !== null)

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: "420px", width: "100%", borderRadius: "12px" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mapped.map(({ item, lat, lng }) => (
        <Marker key={item.id} position={[lat, lng]}>
          <Popup>
            <div style={{ minWidth: 160 }}>
              <strong>{item.leak}</strong>
              <br />
              <span style={{ color: "#4c8dff" }}>{item.group}</span>
              {item.date && (
                <>
                  <br />
                  <time
                    dateTime={new Date(item.date).toISOString()}
                    style={{ fontSize: "0.85em", color: "#7b8a9a" }}
                  >
                    {new Date(item.date).toLocaleString(undefined, {
                      year: "numeric", month: "short", day: "2-digit",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </time>
                </>
              )}
              {item.data && (
                <>
                  <br />
                  <span style={{ fontSize: "0.85em" }}>{item.data}</span>
                </>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
