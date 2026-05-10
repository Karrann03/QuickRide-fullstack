import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../context/AuthContext";

const BACKEND_BASE = "http://localhost:7973";

const riderIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const driverIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

function RideTracking() {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const token = useMemo(
    () => auth.token || localStorage.getItem("token"),
    [auth.token]
  );

  const userId = useMemo(
    () => auth.userId || localStorage.getItem("userId"),
    [auth.userId]
  );

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.loading && (!token || !userId)) {
      navigate("/login");
      return;
    }

    const fetchRide = async () => {
      if (!token || !userId) return;

      try {
        const res = await fetch(`${BACKEND_BASE}/ride/active/${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (res.status === 401 || res.status === 403) {
          navigate("/login");
          return;
        }

        if (!res.ok) {
          setRide(null);
          return;
        }

        const data = await res.json();
        setRide(data);
        localStorage.setItem("activeRide", JSON.stringify(data));

        if (data?.rideId) {
          localStorage.setItem("activeRideId", String(data.rideId));
        }

        if (data?.status === "COMPLETED" || data?.status === "CANCELLED") {
          localStorage.removeItem("activeRideId");
        }
      } catch (err) {
        console.error("Failed to fetch active ride", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRide();
    const interval = setInterval(fetchRide, 5000);
    return () => clearInterval(interval);
  }, [auth.loading, token, userId, navigate]);

  if (loading) {
    return <h2 style={{ textAlign: "center", marginTop: "30px" }}>Loading ride...</h2>;
  }

  if (!ride) {
    return <h2 style={{ textAlign: "center", marginTop: "30px" }}>No active ride found</h2>;
  }

  const pickup = [ride.pickupLat, ride.pickupLong];
  const drop = [ride.dropLat, ride.dropLong];
  const driver =
    ride.driverLat != null && ride.driverLong != null
      ? [ride.driverLat, ride.driverLong]
      : null;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Ride Status: {ride.status}</h2>
      <p>Ride ID: {ride.rideId}</p>
      <p>Driver ID: {ride.driverId ?? "Searching..."}</p>
      {ride.otp && <p>OTP: {ride.otp}</p>}

      <div
        style={{
          height: "500px",
          marginTop: "20px",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <MapContainer center={pickup} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={pickup} icon={riderIcon}>
            <Popup>Pickup Location</Popup>
          </Marker>

          <Marker position={drop} icon={riderIcon}>
            <Popup>Drop Location</Popup>
          </Marker>

          {driver && (
            <Marker position={driver} icon={driverIcon}>
              <Popup>Driver Location</Popup>
            </Marker>
          )}

          <Polyline positions={[pickup, drop]} />
          {driver && <Polyline positions={[driver, pickup]} />}
        </MapContainer>
      </div>
    </div>
  );
}

export default RideTracking;