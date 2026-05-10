import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  GoogleMap,
  Marker,
  Polyline,
  useLoadScript,
} from "@react-google-maps/api";
import "../styles/DriverLiveRide.css";
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

function DriverLiveRide() {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();

  const token = useMemo(
    () => auth?.token || localStorage.getItem("token"),
    [auth?.token]
  );

  const driverId = useMemo(
    () => auth?.driverId || localStorage.getItem("driverId"),
    [auth?.driverId]
  );

  const [ride, setRide] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const [driverLocation, setDriverLocation] = useState(defaultCenter);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("Loading current ride...");
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [isEndingRide, setIsEndingRide] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyAzC2NZ5fdQBv7h8S6XgPdxF4wmULA48KQ",
  });

  const currentRideId = useMemo(() => {
    const storedRide = localStorage.getItem("currentRide");
    if (storedRide) {
      try {
        const parsed = JSON.parse(storedRide);
        return parsed?.rideId || null;
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const pickupLocation = useMemo(
    () => ({
      lat: Number(ride?.pickupLatitude || 0),
      lng: Number(ride?.pickupLongitude || 0),
    }),
    [ride]
  );

  const dropLocation = useMemo(
    () => ({
      lat: Number(ride?.dropLatitude || 0),
      lng: Number(ride?.dropLongitude || 0),
    }),
    [ride]
  );

  const isRideStarted =
    ride?.status === "STARTED" ||
    ride?.status === "ONGOING" ||
    ride?.status === "IN_PROGRESS";

  const targetLocation = isRideStarted ? dropLocation : pickupLocation;

  const hasTargetLocation =
    Number.isFinite(targetLocation.lat) &&
    Number.isFinite(targetLocation.lng) &&
    targetLocation.lat !== 0 &&
    targetLocation.lng !== 0;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fetchCurrentRide = useCallback(async () => {
    try {
      let rideId = currentRideId;

      if (!rideId && driverId) {
        const rideRes = await axios.get(
          `${BACKEND_BASE}/driver/current-ride/${driverId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          }
        );

        if (rideRes.data) {
          localStorage.setItem("currentRide", JSON.stringify(rideRes.data));
          rideId = rideRes.data.rideId;
        }
      }

      if (!rideId) {
        setRide(null);
        setMessage("No active ride found.");
        return;
      }

      const res = await axios.get(`${BACKEND_BASE}/ride/id/${rideId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      setRide(res.data);
      localStorage.setItem("currentRide", JSON.stringify(res.data));

      if (res.data.status === "ACCEPTED") {
        setMessage("Navigate to pickup location and verify OTP.");
      } else if (
        res.data.status === "STARTED" ||
        res.data.status === "ONGOING" ||
        res.data.status === "IN_PROGRESS"
      ) {
        setMessage("Ride started. Navigate to drop location.");
      } else if (res.data.status === "COMPLETED") {
        setMessage("Ride completed.");
        localStorage.removeItem("currentRide");
      } else {
        setMessage(`Ride status: ${res.data.status}`);
      }
    } catch (error) {
      console.error(error?.response?.data || error.message);
      setMessage("Could not load current ride.");
    }
  }, [currentRideId, driverId, token]);

  
  const updateDriverLocationToBackend = async (lat, lng) => {
  try {
    const token = auth?.token || localStorage.getItem("token");

    if (!token) {
      console.error("No token found");
      return;
    }

    const response = await axios.post(
      `${BACKEND_BASE}/driver/update-location/${driverId}`,
      {
        latitude: lat,
        longitude: lng,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Location updated:", response.data);
  } catch (error) {
    console.error("Failed to update driver location", error.response?.data || error.message);
  }
};

  const verifyOtp = async () => {
    if (!ride?.rideId || !otp.trim()) {
      setMessage("Please enter OTP.");
      return;
    }

    try {
      setIsSubmittingOtp(true);

      const res = await axios.post(
        `${BACKEND_BASE}/ride/verify-otp/${ride.rideId}/${otp}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      setRide(res.data);
      localStorage.setItem("currentRide", JSON.stringify(res.data));
      setMessage("OTP verified. Navigate to drop location now.");
      setOtp("");
    } catch (error) {
      console.error(error?.response?.data || error.message);
      setMessage("OTP verification failed.");
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  const endRide = async () => {
    if (!ride?.rideId) return;

    try {
      setIsEndingRide(true);

      const res = await axios.post(
        `${BACKEND_BASE}/ride/end/${ride.rideId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      setRide(res.data);
      localStorage.removeItem("currentRide");
      setMessage("Ride ended successfully.");
      navigate("/driver/dashboard");
    } catch (error) {
      console.error(error?.response?.data || error.message);
      setMessage("Failed to end ride.");
    } finally {
      setIsEndingRide(false);
    }
  };

  useEffect(() => {
    if (auth.loading) return;

    if (!token || !driverId) {
      navigate("/login");
      return;
    }

    fetchCurrentRide();

    const rideInterval = setInterval(() => {
      fetchCurrentRide();
    }, 3000);

    return () => clearInterval(rideInterval);
  }, [auth.loading, token, driverId, navigate, fetchCurrentRide]);

  useEffect(() => {
    if (!driverId) return;

    let watchId;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setDriverLocation({ lat, lng });
          updateDriverLocationToBackend(lat, lng);
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [driverId, updateDriverLocationToBackend]);

  useEffect(() => {
    if (!mapRef || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();

    if (
      Number.isFinite(driverLocation?.lat) &&
      Number.isFinite(driverLocation?.lng)
    ) {
      bounds.extend(driverLocation);
    }

    if (hasTargetLocation) {
      bounds.extend(targetLocation);
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
  }, [mapRef, driverLocation, hasTargetLocation, targetLocation]);

  const polylinePath = hasTargetLocation
    ? [driverLocation, targetLocation]
    : [driverLocation];

  if (loadError) {
    return (
      <div className="driver-live-page">
        <div className="driver-map-loading">Failed to load Google Map.</div>
      </div>
    );
  }

  return (
    <div className="driver-live-page">
      <div className="driver-live-topbar">
        <div
          className="driver-live-brand"
          onClick={() => navigate("/driver/dashboard")}
        >
          QuickRide Driver
        </div>

        <div className="driver-live-topbar-actions">
          <button
            className="driver-topbar-btn ghost"
            onClick={() => navigate("/driver/dashboard")}
          >
            Dashboard
          </button>
          <button className="driver-topbar-btn solid" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="driver-layout">
        <div className="driver-live-sheet">
          <div className="driver-sheet-handle"></div>

          <div className="driver-live-header">
            <div>
              <p className="driver-sheet-mini">Current trip</p>
              <h2>
                {isRideStarted ? "Go to drop location" : "Go to pickup location"}
              </h2>
              <p className="driver-live-message">{message}</p>
            </div>

            <div className="driver-status-pill">{ride?.status || "Loading"}</div>
          </div>

          {ride && (
            <>
              <div className="driver-live-grid">
                <div className="driver-info-card">
                  <span>Ride ID</span>
                  <strong>{ride.rideId || "--"}</strong>
                </div>

                <div className="driver-info-card">
                  <span>Fare</span>
                  <strong>₹{Math.round(Number(ride.fare || 0))}</strong>
                </div>

                <div className="driver-info-card">
                  <span>Distance</span>
                  <strong>{Number(ride.distanceKm || 0).toFixed(2)} km</strong>
                </div>

                <div className="driver-info-card">
                  <span>OTP</span>
                  <strong>{ride.otp || "Pending"}</strong>
                </div>
              </div>

              <div className="driver-location-card">
                <div className="driver-location-row">
                  <div className="driver-location-dot pickup"></div>
                  <div>
                    <span>{isRideStarted ? "Heading to drop" : "Pickup location"}</span>
                    <strong>
                      {isRideStarted
                        ? ride.dropLocation ||
                          ride.dropAddress ||
                          "Drop location"
                        : ride.pickupLocation ||
                          ride.pickupAddress ||
                          "Pickup location"}
                    </strong>
                  </div>
                </div>
              </div>

              {!isRideStarted && (
                <div className="otp-section">
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="otp-input"
                  />
                  <button
                    className="otp-btn"
                    onClick={verifyOtp}
                    disabled={isSubmittingOtp}
                  >
                    {isSubmittingOtp ? "Verifying..." : "Verify OTP & Start Ride"}
                  </button>
                </div>
              )}

              {isRideStarted && (
                <div className="driver-actions">
                  <button
                    className="end-ride-btn"
                    onClick={endRide}
                    disabled={isEndingRide}
                  >
                    {isEndingRide ? "Ending..." : "End Ride"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="driver-live-map-wrapper">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={hasTargetLocation ? targetLocation : driverLocation}
              zoom={13}
              onLoad={(map) => setMapRef(map)}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                gestureHandling: "greedy",
              }}
            >
              <Marker position={driverLocation} label="Driver" />

              {hasTargetLocation && (
                <Marker
                  position={targetLocation}
                  label={isRideStarted ? "Drop" : "Pickup"}
                />
              )}

              {hasTargetLocation && (
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
            <div className="driver-map-loading">Loading map...</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DriverLiveRide;