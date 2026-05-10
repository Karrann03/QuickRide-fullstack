import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleMap,
  Marker,
  Polyline,
  useLoadScript,
} from "@react-google-maps/api";
import axios from "axios";
import "../styles/UserTrack.css";
import { useAuth } from "../context/AuthContext";

const BACKEND_BASE = "http://localhost:7973";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 17.385044,
  lng: 78.486671,
};

const activeStatuses = [
  "REQUESTED",
  "ACCEPTED",
  "STARTED",
  "ONGOING",
  "IN_PROGRESS",
];

function UserTrack() {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();

  const token = useMemo(() => {
    return auth?.token || localStorage.getItem("token");
  }, [auth?.token]);

  const rideId = useMemo(() => {
    return localStorage.getItem("activeRideId");
  }, []);

  const [ride, setRide] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const [userLocation, setUserLocation] = useState(defaultCenter);
  const [loadingText, setLoadingText] = useState("Loading your ride...");
  const [statusText, setStatusText] = useState("");

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyAzC2NZ5fdQBv7h8S6XgPdxF4wmULA48KQ",
  });

  const driverLocation = useMemo(() => {
    return {
      lat: Number(ride?.driverLatitude ?? ride?.driver?.latitude ?? 0),
      lng: Number(ride?.driverLongitude ?? ride?.driver?.longitude ?? 0),
    };
  }, [ride]);

  const hasDriverLocation = useMemo(() => {
    return (
      Number.isFinite(driverLocation.lat) &&
      Number.isFinite(driverLocation.lng) &&
      driverLocation.lat !== 0 &&
      driverLocation.lng !== 0
    );
  }, [driverLocation]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const updateRideState = useCallback((r) => {
    setRide(r);

    if (!r) {
      setStatusText("");
      return;
    }

    localStorage.setItem("activeRide", JSON.stringify(r));

    if (r.status === "REQUESTED") {
      setStatusText("Looking for a nearby driver");
    } else if (r.status === "ACCEPTED") {
      setStatusText("Your driver is on the way");
    } else if (
      r.status === "STARTED" ||
      r.status === "ONGOING" ||
      r.status === "IN_PROGRESS"
    ) {
      setStatusText("You’re on your way");
    } else if (r.status === "COMPLETED") {
      setStatusText("Ride completed");
      localStorage.removeItem("activeRide");
      localStorage.removeItem("activeRideId");
    } else if (r.status === "CANCELLED" || r.status === "REJECTED") {
      setStatusText(`Ride ${r.status.toLowerCase()}`);
      localStorage.removeItem("activeRide");
      localStorage.removeItem("activeRideId");
    } else {
      setStatusText(r.status || "");
    }
  }, []);

  const fetchRide = useCallback(async () => {
    if (!rideId) {
      navigate("/user/dashboard");
      return;
    }

    if (!token) return;

    try {
      const res = await axios.get(`${BACKEND_BASE}/ride/id/${rideId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      const data = res.data;
      updateRideState(data);

      if (!activeStatuses.includes(data.status)) {
        setLoadingText("No active ride found");
      } else {
        setLoadingText("");
      }
    } catch (e) {
      console.error("Ride fetch error:", e?.response?.data || e.message);
      setLoadingText("Could not load ride details");
    }
  }, [navigate, rideId, token, updateRideState]);

  useEffect(() => {
    if (auth.loading) return;

    if (!token) {
      navigate("/login");
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          setUserLocation(defaultCenter);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    } else {
      setUserLocation(defaultCenter);
    }
  }, [auth.loading, token, navigate]);

  useEffect(() => {
    if (auth.loading || !token) return;

    fetchRide();

    const interval = setInterval(() => {
      fetchRide();
    }, 3000);

    return () => clearInterval(interval);
  }, [auth.loading, token, fetchRide]);

  useEffect(() => {
    if (!mapRef || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();

    if (
      Number.isFinite(userLocation?.lat) &&
      Number.isFinite(userLocation?.lng)
    ) {
      bounds.extend(userLocation);
    }

    if (hasDriverLocation) {
      bounds.extend(driverLocation);
    }

    if (!bounds.isEmpty()) {
      const isMobile = window.innerWidth <= 900;

      mapRef.fitBounds(bounds, {
        top: isMobile ? 60 : 80,
        right: isMobile ? 30 : 60,
        bottom: isMobile ? 60 : 80,
        left: isMobile ? 30 : 60,
      });
    }
  }, [mapRef, userLocation, hasDriverLocation, driverLocation]);

  const polylinePath = hasDriverLocation
    ? [userLocation, driverLocation]
    : [userLocation];

  const showRideDetails = !!ride;
  const rideStatus = ride?.status || "Loading";

  if (loadError) {
    return (
      <div className="track-page">
        <div className="track-loading-map">Failed to load Google Map.</div>
      </div>
    );
  }

  return (
    <div className="track-page">
      <div className="track-topbar">
        <div
          className="track-brand"
          onClick={() => navigate("/user/dashboard")}
        >
          QuickRide
        </div>

        <div className="track-topbar-actions">
          <button
            className="track-nav-btn"
            onClick={() => navigate("/user/dashboard")}
          >
            Dashboard
          </button>
          <button className="track-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="track-layout">
        <div className="ride-sheet">
          <div className="sheet-handle"></div>

          <div className="ride-sheet-header">
            <div>
              <p className="sheet-mini">Live trip</p>
              <h2>{statusText || "Tracking your ride"}</h2>
            </div>

            <div className="ride-status-pill">{rideStatus}</div>
          </div>

          {loadingText && !ride && (
            <div className="sheet-message">{loadingText}</div>
          )}

          {showRideDetails && (
            <>
              <div className="driver-card">
                <div className="driver-avatar">
                  {(ride?.driverName || ride?.driver?.name || "D")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="driver-meta">
                  <h3>
                    {ride?.driverName ||
                      ride?.driver?.name ||
                      "Driver assigned soon"}
                  </h3>
                  <p>
                    {ride?.vehicleNumber ||
                      ride?.driver?.vehicleNumber ||
                      "Vehicle details will appear soon"}
                  </p>
                </div>

                <div className="eta-box">
                  <span>ETA</span>
                  <strong>
                    {ride?.etaMinutes ? `${ride.etaMinutes} min` : "--"}
                  </strong>
                </div>
              </div>

              <div className="ride-info-grid">
                <div className="ride-info-card">
                  <span>Fare</span>
                  <strong>₹{Math.round(Number(ride?.fare || 0))}</strong>
                </div>

                <div className="ride-info-card">
                  <span>Distance</span>
                  <strong>
                    {Number(ride?.distanceKm || 0).toFixed(2)} km
                  </strong>
                </div>

                <div className="ride-info-card">
                  <span>OTP</span>
                  <strong>{ride?.otp || "Pending"}</strong>
                </div>

                <div className="ride-info-card">
                  <span>Ride ID</span>
                  <strong>{ride?.rideId || "--"}</strong>
                </div>
              </div>

              <div className="ride-journey-card">
                <div className="journey-row">
                  <div className="journey-dot pickup"></div>
                  <div>
                    <span>Pickup</span>
                    <strong>
                      {ride?.pickupLocation ||
                        ride?.pickupAddress ||
                        "Pickup location"}
                    </strong>
                  </div>
                </div>

                <div className="journey-line"></div>

                <div className="journey-row">
                  <div className="journey-dot drop"></div>
                  <div>
                    <span>Drop</span>
                    <strong>
                      {ride?.dropLocation ||
                        ride?.dropAddress ||
                        "Drop location"}
                    </strong>
                  </div>
                </div>
              </div>

              {(ride?.status === "ACCEPTED" ||
                ride?.status === "STARTED" ||
                ride?.status === "ONGOING" ||
                ride?.status === "IN_PROGRESS") && (
                <div className="sheet-actions">
                  <button
                    className="sheet-primary-btn"
                    onClick={() => navigate("/user/dashboard")}
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="track-map-wrapper">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={hasDriverLocation ? driverLocation : userLocation}
              zoom={13}
              onLoad={(map) => {
                setMapRef(map);
              }}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                gestureHandling: "greedy",
              }}
            >
              <Marker position={userLocation} label="You" />

              {hasDriverLocation && (
                <Marker position={driverLocation} label="Driver" />
              )}

              {hasDriverLocation && (
                <Polyline
                  path={polylinePath}
                  options={{
                    strokeColor: "#111111",
                    strokeOpacity: 1,
                    strokeWeight: 5,
                  }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="track-loading-map">Loading map...</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserTrack;