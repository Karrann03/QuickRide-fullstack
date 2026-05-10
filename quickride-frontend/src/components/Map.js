import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import axios from "axios";

const libraries = ["places"];
const mapContainerStyle = {
  width: "100%",
  height: "500px",
};
const defaultCenter = { lat: 17.445, lng: 78.348 }; // Hyderabad default

const Map = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyAzC2NZ5fdQBv7h8S6XgPdxF4wmULA48KQ",
    libraries,
  });

  const [currentPosition, setCurrentPosition] = useState(defaultCenter);
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [drivers, setDrivers] = useState([]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      });
    }
  }, []);

  // Fetch nearby drivers based on pickup location
  const fetchNearbyDrivers = useCallback(async (lat, lng) => {
    try {
      const token = localStorage.getItem("token"); // JWT from login
      const res = await axios.get(
        `http://loxalhost:7973/driver/nearby?lat=${lat}&lng=${lng}&radius=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDrivers(res.data);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  }, []);

  // Handle map click to set pickup/drop
  const handleMapClick = (e) => {
    if (!pickup) {
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setPickup(coords);
      fetchNearbyDrivers(coords.lat, coords.lng); // fetch drivers as soon as pickup is selected
    } else if (!drop) {
      setDrop({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  };

  // Request ride
  const requestRide = async () => {
    if (!pickup || !drop) return alert("Select pickup and drop locations!");
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:7973/ride/request",
        {
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropLat: drop.lat,
          dropLng: drop.lng,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Ride requested successfully! Driver assigned.");
      fetchNearbyDrivers(pickup.lat, pickup.lng); // refresh drivers
    } catch (err) {
      console.error(err);
      alert("Error requesting ride.");
    }
  };

  if (loadError) return "Error loading map";
  if (!isLoaded) return "Loading Maps";

  return (
    <div>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        center={currentPosition}
        onClick={handleMapClick}
      >
        {/* Pickup Marker */}
        {pickup && <Marker position={pickup} label="P" />}

        {/* Drop Marker */}
        {drop && <Marker position={drop} label="D" />}

        {/* Nearby Drivers */}
        {drivers.map((driver) => (
          <Marker
            key={driver.id}
            position={{ lat: driver.latitude, lng: driver.longitude }}
            label="🚗"
          />
        ))}
      </GoogleMap>

      <div style={{ marginTop: "10px" }}>
        <button onClick={requestRide} style={{ padding: "10px 20px" }}>
          Request Ride
        </button>
        <p>
          Click on the map to select Pickup (P) and Drop (D) points. ONLINE
          drivers are shown as 🚗.
        </p>
      </div>
    </div>
  );
};

export default Map;