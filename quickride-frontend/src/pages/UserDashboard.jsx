import React, { useEffect, useMemo, useState } from "react";
import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const BACKEND_BASE = "http://localhost:7973";

function UserDashboard() {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  

  
  const token = useMemo(() => {
    return auth?.token || localStorage.getItem("token");
  }, [auth?.token]);

  const userId = useMemo(() => {
    return auth?.userId || localStorage.getItem("userId");
  }, [auth?.userId]);

  const [ride, setRide] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const updateRideUI = (r) => {
    if (!r) {
      setRide(null);
      setStatusMsg("");
      return;
    }

    setRide(r);

    if (r.rideId) {
      localStorage.setItem("activeRideId", String(r.rideId));
      localStorage.setItem("activeRide", JSON.stringify(r));
    }

    if (r.status === "REQUESTED") {
      setStatusMsg("Searching for a nearby driver...");
    } else if (r.status === "ACCEPTED") {
      setStatusMsg("Your driver accepted the ride and is on the way.");
    } else if (
      r.status === "ONGOING" ||
      r.status === "STARTED" ||
      r.status === "IN_PROGRESS"
    ) {
      setStatusMsg("Your ride is in progress.");
    } else if (r.status === "COMPLETED") {
      setStatusMsg("Ride completed successfully.");
      localStorage.removeItem("activeRideId");
      localStorage.removeItem("activeRide");
    } else if (r.status === "CANCELLED" || r.status === "REJECTED") {
      setStatusMsg(`Ride ${r.status.toLowerCase()}.`);
      localStorage.removeItem("activeRideId");
      localStorage.removeItem("activeRide");
    } else {
      setStatusMsg("");
    }
  };

  const recoverActiveRide = async () => {
    if (!userId || !token) return;

    try {
      const res = await axios.get(`${BACKEND_BASE}/ride/active/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (res.data) {
        updateRideUI(res.data);
      }
    } catch (e) {
      console.log("No active ride found for user");
      setRide(null);
      setStatusMsg("");
      localStorage.removeItem("activeRideId");
      localStorage.removeItem("activeRide");
    }
  };

  const fetchRideStatus = async () => {
    const rideId = localStorage.getItem("activeRideId");

    if (!rideId || !token) return;

    try {
      const res = await axios.get(`${BACKEND_BASE}/ride/id/${rideId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      updateRideUI(res.data);
    } catch (e) {
      console.error(e?.response?.data || e.message);

      
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        console.log("Ride status API unauthorized. Staying on dashboard.");
        setStatusMsg("Could not verify active ride right now.");
        return;
      }

      setStatusMsg("Could not fetch ride status");
    }
  };

  useEffect(() => {
    if (auth.loading) return;

    if (!token || !userId) {
      navigate("/login");
      return;
    }

    recoverActiveRide();

    const t = setInterval(() => {
      fetchRideStatus();
    }, 3000);

    return () => clearInterval(t);
  }, [auth.loading, token, userId]);

  const canTrackRide =
    ride &&
    ["ACCEPTED", "ONGOING", "STARTED", "IN_PROGRESS"].includes(ride.status);

  const hasActiveRide =
    ride &&
    ["REQUESTED", "ACCEPTED", "ONGOING", "STARTED", "IN_PROGRESS"].includes(
      ride.status
    );

  return (
    <div className="dashboard-container">
      <nav className="dashboard-navbar">
        <div className="dashboard-logo">QuickRide</div>

        <div className="dashboard-nav-links">
          <button className="nav-link-btn" onClick={() => navigate("/user/dashboard")}>
            Home
          </button>
          <button className="nav-link-btn" onClick={() => navigate("/user/trips")}>
            Trips
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <section className="dashboard-hero">
        <div className="hero-left">
          <span className="hero-badge">Ride smarter</span>
          <h1>Welcome back, Rider</h1>
          <p>
            Book premium rides, track your driver in real time, and continue
            your journey with a clean and seamless experience.
          </p>

          <div className="dashboard-actions">
            <button
              className="primary-btn"
              onClick={() => navigate("/request-ride")}
            >
              Request a Ride
            </button>

            <button
              className="secondary-btn"
              onClick={() => navigate("/user/trips")}
            >
              View Your Trips
            </button>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-info-card">
            <h3>QuickRide</h3>
            <p>Fast pickups. Professional drivers. Elegant experience.</p>
          </div>
        </div>
      </section>

      {hasActiveRide && (
        <section className="active-ride-section">
          <div className="active-ride-card">
            <div className="active-ride-header">
              <div>
                <h2>Active Ride</h2>
                <p>{statusMsg}</p>
              </div>

              <div className="ride-status-pill">{ride.status}</div>
            </div>

            <div className="ride-details-grid">
              <div className="ride-detail-box">
                <span>Ride ID</span>
                <strong>{ride.rideId || "N/A"}</strong>
              </div>

              <div className="ride-detail-box">
                <span>Driver</span>
                <strong>
                  {ride.driverName ||
                    ride.driver?.name ||
                    ride.driverId ||
                    "Assigned soon"}
                </strong>
              </div>

              <div className="ride-detail-box">
                <span>Fare</span>
                <strong>₹{Math.round(Number(ride.fare || 0))}</strong>
              </div>

              <div className="ride-detail-box">
                <span>Distance</span>
                <strong>{Number(ride.distanceKm || 0).toFixed(2)} km</strong>
              </div>

              <div className="ride-detail-box">
                <span>OTP</span>
                <strong>
                  {ride.otp || "Will appear after driver is assigned"}
                </strong>
              </div>

              <div className="ride-detail-box">
                <span>ETA</span>
                <strong>
                  {ride.etaMinutes
                    ? `${ride.etaMinutes} min`
                    : "Calculating..."}
                </strong>
              </div>

              <div className="ride-detail-box">
                <span>Vehicle</span>
                <strong>
                  {ride.vehicleNumber ||
                    ride.driver?.vehicleNumber ||
                    "Will appear after driver is assigned"}
                </strong>
              </div>

              <div className="ride-detail-box">
                <span>Status</span>
                <strong>{ride.status || "N/A"}</strong>
              </div>
            </div>

            {canTrackRide && (
              <button
                className="track-btn"
                onClick={() => navigate("/user/track")}
              >
                Track Driver
              </button>
            )}
          </div>
        </section>
      )}

      <section className="dashboard-bottom-grid">
        <div className="dashboard-feature-card">
          <h3>Book in seconds</h3>
          <p>
            Request a ride instantly and get connected to the nearest available
            driver.
          </p>
        </div>

        <div className="dashboard-feature-card">
          <h3>Track live ride</h3>
          <p>
            Follow your driver’s progress with live updates, ETA, and route
            details.
          </p>
        </div>

        <div className="dashboard-feature-card">
          <h3>Safe pickup</h3>
          <p>
            Use OTP verification for a secure and reliable ride-start
            experience.
          </p>
        </div>
      </section>
    </div>
  );
}

export default UserDashboard;