import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "../styles/DriverDashboard.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useAuth } from "../context/AuthContext";

const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 17.445, lng: 78.348 };

const API_KEY = "AIzaSyAzC2NZ5fdQBv7h8S6XgPdxF4wmULA48KQ";
const BACKEND_BASE = "http://localhost:7973";

function DriverDashboard() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const { auth, logout } = useAuth();

  const token = useMemo(() => {
    const authToken = auth?.token;
    const localToken = localStorage.getItem("token");

    console.log("auth token:", authToken);
    console.log("localStorage token:", localToken);

    return authToken || localToken || null;
  }, [auth?.token]);

  const driverId = useMemo(() => {
    const id = auth?.driverId || localStorage.getItem("driverId");
    return id ? Number(id) : null;
  }, [auth?.driverId]);

  const [currentPosition, setCurrentPosition] = useState(defaultCenter);
  const [statusMsg, setStatusMsg] = useState("Getting your live location...");
  const [geoError, setGeoError] = useState("");
  const [isOnline, setIsOnline] = useState(false);

  const [currentRide, setCurrentRide] = useState(null);
  const [rideLoading, setRideLoading] = useState(true);
  const [rideMessage, setRideMessage] = useState("Checking your active ride...");
  const [cancelLoading, setCancelLoading] = useState(false);

  const [dashboardStats, setDashboardStats] = useState({
    todayEarnings: 1850,
    weeklyEarnings: 9640,
    totalTrips: 128,
    todayTrips: 7,
    rating: 4.8,
    completionRate: 96,
    onlineHours: 6.5,
  });

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: API_KEY,
  });

  const authConfig = useMemo(
    () => ({
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : {
            "Content-Type": "application/json",
          },
      // withCredentials: true,
    }),
    [token]
  );

  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  const handleLogout = () => {
    localStorage.removeItem("currentRide");
    logout();
    navigate("/login");
  };

  const goToRequests = () => {
    navigate("/driver/available-rides");
  };

  const goToLiveRide = () => {
    if (currentRide) {
      localStorage.setItem("currentRide", JSON.stringify(currentRide));
      navigate("/driver/live-ride");
    }
  };

  const updateDriverLocation = useCallback(
    async (lat, lng) => {
      if (!driverId || !token) {
        console.log("Missing driverId or token");
        return;
      }

      try {
        console.log("Updating location with token:", token);
        console.log("Driver ID:", driverId);

        await axios.put(
          `${BACKEND_BASE}/driver/update-Location/${driverId}?latitude=${lat}&longitude=${lng}`,
            {},
          authConfig
        );
      } catch (err) {
        console.error(
          "Location update failed:",
          err?.response?.data || err.message
          
        );
      }
    },
    [driverId, token, authConfig]
  );
  

  const fetchCurrentRide = useCallback(async () => {
    if (!driverId || !token) {
      setRideLoading(false);
      setCurrentRide(null);
      setRideMessage("Please login again as driver.");
      return;
    }

    try {
      setRideLoading(true);

      const res = await axios.get(
        `${BACKEND_BASE}/driver/current-ride/${driverId}`,
        authConfig
      );

      if (res.data && res.data.rideId) {
        setCurrentRide(res.data);
        localStorage.setItem("currentRide", JSON.stringify(res.data));

        const status = res.data.status || "";
        if (
          status === "ACCEPTED" ||
          status === "STARTED" ||
          status === "ONGOING" ||
          status === "IN_PROGRESS"
        ) {
          setRideMessage("You have an active ride. Continue from live ride.");
        } else {
          setRideMessage(`Ride found with status ${status}.`);
        }
      } else {
        setCurrentRide(null);
        localStorage.removeItem("currentRide");
        setRideMessage("No active ride right now.");
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setCurrentRide(null);
        localStorage.removeItem("currentRide");
        setRideMessage("No active ride right now.");
      } else {
        console.error(
          "Current ride fetch failed:",
          err?.response?.data || err.message
        );
        setCurrentRide(null);
        setRideMessage("Could not check current ride.");
      }
    } finally {
      setRideLoading(false);
    }
  }, [driverId, token, authConfig]);

  const handleCancelRide = async () => {
    if (!currentRide?.rideId || !token || !driverId) return;

    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this ride?"
    );
    if (!confirmCancel) return;

    try {
      setCancelLoading(true);

      await axios.put(
        `${BACKEND_BASE}/ride/cancel/${currentRide.rideId}/${driverId}`,
        {},
        authConfig
      );

      setCurrentRide(null);
      localStorage.removeItem("currentRide");
      setRideMessage("Ride cancelled successfully.");
      alert("Ride cancelled successfully.");
    } catch (err) {
      console.error("Cancel ride failed:", err?.response?.data || err.message);
      alert(
        err?.response?.data?.message ||
          "Unable to cancel ride. Check backend endpoint."
      );
    } finally {
      setCancelLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.loading) return;

    if (!token || !driverId) {
      navigate("/login");
      return;
    }

    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported");
      setStatusMsg("Geolocation not supported");
      setIsOnline(false);
      return;
    }

    setStatusMsg("Tracking your live location...");
    let lastSentAt = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const loc = { lat, lng };

        setCurrentPosition(loc);
        setGeoError("");
        setIsOnline(true);
        setStatusMsg("You are online and ready for trips");

        if (mapRef.current) {
          mapRef.current.panTo(loc);
          mapRef.current.setZoom(16);
        }

        const now = Date.now();
        if (now - lastSentAt >= 3000) {
          lastSentAt = now;
          updateDriverLocation(lat, lng);
        }
      },
      (err) => {
        setGeoError(err?.message || "Location permission denied");
        setStatusMsg("Location permission denied");
        setIsOnline(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [auth?.loading, token, driverId, navigate, updateDriverLocation]);

  useEffect(() => {
    if (auth?.loading || !token || !driverId) return;

    fetchCurrentRide();

    const interval = setInterval(() => {
      fetchCurrentRide();
    }, 5000);

    return () => clearInterval(interval);
  }, [auth?.loading, token, driverId, fetchCurrentRide]);

  if (loadError) {
    return <div className="driver-dashboard-fallback">Error loading map</div>;
  }

  if (!isLoaded) {
    return <div className="driver-dashboard-fallback">Loading Maps...</div>;
  }

  return (
    <div className="driver-dashboard-page">
      <div className="driver-dashboard-navbar">
        <div
          className="driver-dashboard-logo"
          onClick={() => navigate("/driver/dashboard")}
        >
          QuickRide Driver
        </div>

        <div className="driver-dashboard-nav-links">
          <button className="view-requests-btn" onClick={goToRequests}>
            Ride Requests
          </button>
          <button onClick={handleLogout} className="driver-logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="driver-top-summary">
        <div className="summary-card highlight-card">
          <span>Today Earnings</span>
          <h2>₹{dashboardStats.todayEarnings}</h2>
          <p>{dashboardStats.todayTrips} trips completed today</p>
        </div>

        <div className="summary-card">
          <span>Weekly Earnings</span>
          <h2>₹{dashboardStats.weeklyEarnings}</h2>
          <p>Keep driving to increase weekly income</p>
        </div>

        <div className="summary-card">
          <span>Total Trips</span>
          <h2>{dashboardStats.totalTrips}</h2>
          <p>Lifetime completed trips</p>
        </div>

        <div className="summary-card">
          <span>Driver Rating</span>
          <h2>{dashboardStats.rating}★</h2>
          <p>{dashboardStats.completionRate}% completion rate</p>
        </div>
      </div>

      <div className="driver-dashboard-layout">
        <div className="driver-dashboard-left-panel">
          <div className="driver-hero-card">
            <p className="driver-panel-mini">Driver workspace</p>
            <h2 className="driver-page-title">Welcome back, Driver</h2>
            <p className="driver-subtitle">{statusMsg}</p>

            {geoError && <p className="driver-error-text">{geoError}</p>}

            <div className="driver-status-strip">
              <div className="driver-status-label">Driver Status</div>
              <div
                className={`driver-status-pill ${isOnline ? "online" : "offline"}`}
              >
                {isOnline ? "ONLINE" : "OFFLINE"}
              </div>
            </div>
          </div>

          <div className="driver-quick-grid">
            <div className="dashboard-card">
              <div className="driver-card-title">Current Location</div>
              <div className="driver-card-text">
                Lat: <strong>{currentPosition.lat.toFixed(5)}</strong>
              </div>
              <div className="driver-card-text">
                Lng: <strong>{currentPosition.lng.toFixed(5)}</strong>
              </div>
              <div className="driver-helper-text">
                Keep location on so riders can discover you faster.
              </div>
            </div>

            <div className="dashboard-card">
              <div className="driver-card-title">Online Hours</div>
              <div className="big-stat">{dashboardStats.onlineHours} hrs</div>
              <div className="driver-helper-text">
                Total online time for today.
              </div>
            </div>

            <div className="dashboard-card">
              <div className="driver-card-title">Completion Rate</div>
              <div className="big-stat">{dashboardStats.completionRate}%</div>
              <div className="driver-helper-text">
                Better completion means better trust.
              </div>
            </div>

            <div className="dashboard-card">
              <div className="driver-card-title">Ride Requests</div>
              <div className="driver-card-text">
                Check nearby ride requests and accept quickly.
              </div>
              <button className="driver-primary-btn" onClick={goToRequests}>
                View Requests
              </button>
            </div>
          </div>

          <div className="dashboard-card ride-card-large">
            <div className="driver-card-title">Current Ride</div>

            {rideLoading ? (
              <div className="driver-card-text">Checking active ride...</div>
            ) : currentRide ? (
              <>
                <div className="driver-current-ride-grid">
                  <div className="driver-current-ride-item">
                    <span>Status</span>
                    <strong>{currentRide.status || "--"}</strong>
                  </div>

                  <div className="driver-current-ride-item">
                    <span>Ride ID</span>
                    <strong>{currentRide.rideId || "--"}</strong>
                  </div>

                  <div className="driver-current-ride-item">
                    <span>Fare</span>
                    <strong>₹{Math.round(Number(currentRide.fare || 0))}</strong>
                  </div>

                  <div className="driver-current-ride-item">
                    <span>Distance</span>
                    <strong>
                      {Number(
                        currentRide.distanceKm ||
                          currentRide.distance ||
                          0
                      ).toFixed(2)}{" "}
                      km
                    </strong>
                  </div>
                </div>

                <p className="driver-card-text current-ride-msg">{rideMessage}</p>

                <div className="ride-action-row">
                  <button className="driver-live-ride-btn" onClick={goToLiveRide}>
                    {currentRide?.status === "ACCEPTED"
                      ? "Go to Pickup"
                      : currentRide?.status === "STARTED" ||
                        currentRide?.status === "ONGOING" ||
                        currentRide?.status === "IN_PROGRESS"
                      ? "Resume Ride"
                      : "Open Ride"}
                  </button>

                  <button
                    className="driver-cancel-btn"
                    onClick={handleCancelRide}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? "Cancelling..." : "Cancel Ride"}
                  </button>
                </div>
              </>
            ) : (
              <p className="driver-card-text">{rideMessage}</p>
            )}
          </div>

          <div className="dashboard-card">
            <div className="driver-card-title">Today Performance</div>
            <div className="performance-list">
              <div className="performance-item">
                <span>Trips</span>
                <strong>{dashboardStats.todayTrips}</strong>
              </div>
              <div className="performance-item">
                <span>Earnings</span>
                <strong>₹{dashboardStats.todayEarnings}</strong>
              </div>
              <div className="performance-item">
                <span>Rating</span>
                <strong>{dashboardStats.rating}★</strong>
              </div>
              <div className="performance-item">
                <span>Online Time</span>
                <strong>{dashboardStats.onlineHours} hrs</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="driver-dashboard-map-card">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={16}
            center={currentPosition}
            onLoad={onMapLoad}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              clickableIcons: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              gestureHandling: "greedy",
            }}
          >
            <Marker position={currentPosition} title="You (Driver)" />
          </GoogleMap>
        </div>
      </div>
    </div>
  );
}

export default DriverDashboard;