import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/RideRequest.css";
import { useNavigate } from "react-router-dom";
import {
  GoogleMap,
  Marker,
  useLoadScript,
  Autocomplete,
  DirectionsRenderer,
} from "@react-google-maps/api";
import axios from "axios";

const libraries = ["places"];
const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 17.445, lng: 78.348 };

const API_KEY = "AIzaSyAzC2NZ5fdQBv7h8S6XgPdxF4wmULA48KQ";
const BACKEND_BASE = "http://localhost:7973";
const DEFAULT_STATUS = "AVAILABLE";

const RideRequest = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [currentPosition, setCurrentPosition] = useState(defaultCenter);
  const [geoError, setGeoError] = useState("");

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);

  const [pickupText, setPickupText] = useState("");
  const [dropText, setDropText] = useState("");

  const [drivers, setDrivers] = useState([]);
  const [statusMsg, setStatusMsg] = useState("Getting your location...");
  const [directions, setDirections] = useState(null);

  const pickupAutoRef = useRef(null);
  const dropAutoRef = useRef(null);

  const [vehicleType, setVehicleType] = useState("SEDAN");
  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [rideRes, setRideRes] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: API_KEY,
    libraries,
  });

  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported");
      setStatusMsg("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setCurrentPosition(loc);
        setStatusMsg("Select pickup & drop");
        setPickup((prev) => prev ?? loc);

        if (mapRef.current) {
          mapRef.current.panTo(loc);
          mapRef.current.setZoom(15);
        }

        if (window.google?.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: loc }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              setPickupText((prev) => prev || results[0].formatted_address);
            }
          });
        }

        setGeoError("");
      },
      (err) => {
        setGeoError(err?.message || "Location permission denied");
        setStatusMsg("Location permission denied");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const fetchNearbyDrivers = async (lat, lng) => {
    try {
      setStatusMsg("Finding nearby drivers...");

      const url = `${BACKEND_BASE}/driver/nearby?lat=${lat}&lng=${lng}&radius=50&status=${DEFAULT_STATUS}`;

      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const list = Array.isArray(res.data) ? res.data : [];

      const normalized = list
        .map((d) => {
          const dLat =
            d.latitude ?? d.lat ?? d.pickupLat ?? d.currentLat ?? d.driverLat;
          const dLng =
            d.longitude ?? d.lng ?? d.pickupLng ?? d.currentLng ?? d.driverLng;

          return {
            ...d,
            latitude: typeof dLat === "string" ? parseFloat(dLat) : dLat,
            longitude: typeof dLng === "string" ? parseFloat(dLng) : dLng,
          };
        })
        .filter(
          (d) =>
            typeof d.latitude === "number" &&
            !Number.isNaN(d.latitude) &&
            typeof d.longitude === "number" &&
            !Number.isNaN(d.longitude)
        );

      setDrivers(normalized);
      setStatusMsg(
        normalized.length ? "Drivers online nearby" : "No drivers nearby"
      );
    } catch (err) {
      console.error(
        "Error fetching drivers:",
        err?.response?.data || err.message
      );
      setStatusMsg("Driver API error");
      setDrivers([]);
    }
  };

  useEffect(() => {
    const base = pickup || currentPosition;
    if (!base?.lat || !base?.lng) return;

    fetchNearbyDrivers(base.lat, base.lng);
    const t = setInterval(() => fetchNearbyDrivers(base.lat, base.lng), 3000);

    return () => clearInterval(t);
  }, [pickup, currentPosition, token]);

  useEffect(() => {
    if (!pickup || !drop || !window.google) return;

    const dirService = new window.google.maps.DirectionsService();

    dirService.route(
      {
        origin: pickup,
        destination: drop,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);

          const leg = result.routes?.[0]?.legs?.[0];
          const meters = leg?.distance?.value;
          const distanceKm = meters != null ? meters / 1000 : null;

          if (distanceKm != null) {
            setEstimate((prev) => ({
              ...(prev || {}),
              distanceKm,
              fare: prev?.fare ?? 0,
            }));
          }
        } else {
          setDirections(null);
          setEstimate(null);
        }
      }
    );
  }, [pickup, drop]);

  useEffect(() => {
    const fetchFareEstimate = async () => {
      if (estimate?.distanceKm == null || !vehicleType) return;

      try {
        setEstimating(true);

        const res = await axios.post(
          `${BACKEND_BASE}/fare/estimate`,
          {
            distanceKm: estimate.distanceKm,
            vehicleType,
          },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        setEstimate((prev) => ({
          ...(prev || {}),
          fare: Number(res?.data?.fare ?? 0),
        }));
      } catch (err) {
        console.error(
          "fare estimate error:",
          err?.response?.data || err.message
        );
      } finally {
        setEstimating(false);
      }
    };

    fetchFareEstimate();
  }, [estimate?.distanceKm, vehicleType, token]);

  const onPickupPlaceChanged = () => {
    const place = pickupAutoRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    const loc = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    setPickup(loc);
    setPickupText(place.formatted_address || place.name || "");
    setRideRes(null);

    if (mapRef.current) {
      mapRef.current.panTo(loc);
      mapRef.current.setZoom(15);
    }
  };

  const onDropPlaceChanged = () => {
    const place = dropAutoRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    const loc = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    setDrop(loc);
    setDropText(place.formatted_address || place.name || "");
    setRideRes(null);

    if (mapRef.current) {
      mapRef.current.panTo(loc);
      mapRef.current.setZoom(14);
    }
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const clickedLoc = { lat, lng };

    if (!pickup) {
      setPickup(clickedLoc);
      setRideRes(null);

      if (window.google?.maps) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: clickedLoc }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            setPickupText(results[0].formatted_address);
          }
        });
      }
      return;
    }

    if (!drop) {
      setDrop(clickedLoc);
      setRideRes(null);

      if (window.google?.maps) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: clickedLoc }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            setDropText(results[0].formatted_address);
          }
        });
      }
      return;
    }

    setPickup(clickedLoc);
    setDrop(null);
    setDropText("");
    setDirections(null);
    setEstimate(null);
    setRideRes(null);

    if (window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: clickedLoc }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          setPickupText(results[0].formatted_address);
        }
      });
    }
  };

  const resetPins = () => {
    setPickup(null);
    setDrop(null);
    setDirections(null);
    setDrivers([]);
    setPickupText("");
    setDropText("");
    setEstimate(null);
    setRideRes(null);
    setStatusMsg("Select pickup & drop");
  };

  const useMyLocation = () => {
    setPickup(currentPosition);
    setPickupText("Current location");
    setRideRes(null);

    if (mapRef.current) {
      mapRef.current.panTo(currentPosition);
      mapRef.current.setZoom(16);
    }
  };

  const requestRide = async () => {
    if (!pickup || !drop) {
      alert("Select pickup and drop locations!");
      return;
    }

    const userId = Number(localStorage.getItem("userId"));
    if (!userId) {
      alert("userId missing! Save it in localStorage at login.");
      return;
    }

    try {
      setEstimating(true);
      setRideRes(null);

      const res = await axios.post(
        `${BACKEND_BASE}/ride/request`,
        {
          userId,
          vehicleType,
          pickupLat: pickup.lat,
          pickupLong: pickup.lng,
          dropLat: drop.lat,
          dropLong: drop.lng,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const data = res.data;

      setRideRes(data);

      setEstimate({
        distanceKm:
          data?.distanceKm != null
            ? Number(data.distanceKm)
            : estimate?.distanceKm ?? null,
        fare:
          data?.fare != null
            ? Number(data.fare)
            : estimate?.fare ?? 0,
      });

      if (data?.rideId != null) {
        localStorage.setItem("rideId", String(data.rideId));
      }

      alert("Ride requested successfully!");
      navigate("/user/dashboard");
    } catch (err) {
      console.error(
        "ride request error:",
        err?.response?.data || err.message
      );
      alert(err?.response?.data?.message || "Error requesting ride.");
    } finally {
      setEstimating(false);
    }
  };

  const pickupIcon = useMemo(() => {
    if (!window.google) return null;
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: "#22c55e",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
    };
  }, [isLoaded]);

  const dropIcon = useMemo(() => {
    if (!window.google) return null;
    return {
      path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      scale: 6,
      fillColor: "#ef4444",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
    };
  }, [isLoaded]);

  const driverIcon = useMemo(() => {
    if (!window.google) return null;
    return {
      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 5,
      fillColor: "#3b82f6",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
    };
  }, [isLoaded]);

  if (loadError) return <div className="rr-page-state">Error loading map</div>;
  if (!isLoaded) return <div className="rr-page-state">Loading Maps...</div>;

  return (
    <div className="ride-request-page">
      <div className="rr-navbar">
        <div className="rr-logo">QuickRide</div>

        <div className="rr-navbar-actions">
          <button className="rr-nav-btn" onClick={resetPins}>
            Reset
          </button>
          <button
            className="rr-back-btn"
            onClick={() => navigate("/user/dashboard")}
          >
            Back
          </button>
        </div>
      </div>

      <section className="rr-hero">
        <h1>Request your ride in seconds</h1>
        <p>
          Choose pickup and drop, see nearby drivers, check fare estimate, and
          request your ride with a clean Uber-style flow.
        </p>
      </section>

      <section className="rr-layout">
        <div className="rr-left-panel">
          <h2 className="rr-panel-title">Request a Ride</h2>
          <p className="rr-panel-subtitle">{statusMsg}</p>

          {geoError && <p className="rr-error-text">{geoError}</p>}

          <div className="rr-form-grid">
            <div className="rr-input-group rr-full">
              <label>Pickup</label>
              <Autocomplete
                onLoad={(ac) => (pickupAutoRef.current = ac)}
                onPlaceChanged={onPickupPlaceChanged}
              >
                <input
                  value={pickupText}
                  onChange={(e) => setPickupText(e.target.value)}
                  placeholder="Enter pickup location"
                  className="rr-input"
                />
              </Autocomplete>
            </div>

            <div className="rr-input-group rr-full">
              <label>Drop</label>
              <Autocomplete
                onLoad={(ac) => (dropAutoRef.current = ac)}
                onPlaceChanged={onDropPlaceChanged}
              >
                <input
                  value={dropText}
                  onChange={(e) => setDropText(e.target.value)}
                  placeholder="Where to?"
                  className="rr-input"
                />
              </Autocomplete>
            </div>

            <div className="rr-input-group rr-full">
              <label>Vehicle Type</label>
              <select
                className="rr-input"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="MINI_SUV">MINI_SUV</option>
                <option value="SEDAN">SEDAN</option>
                <option value="SUV">SUV</option>
              </select>
            </div>
          </div>

          <div className="rr-action-row">
            <button className="rr-secondary-btn" onClick={useMyLocation}>
              Use My Current Location
            </button>

            <button
              className="rr-primary-btn"
              onClick={requestRide}
              disabled={estimating}
            >
              {estimating ? "Requesting..." : "Request Ride"}
            </button>
          </div>

          {pickup &&
            drop &&
            (rideRes?.distanceKm != null || estimate?.distanceKm != null) && (
              <div className="rr-info-card rr-spacing-top">
                <h3>{rideRes ? "Ride Estimate" : "Estimate"}</h3>

                <p>
                  Distance:{" "}
                  <strong>
                    {Number(
                      rideRes?.distanceKm ?? estimate?.distanceKm ?? 0
                    ).toFixed(2)}{" "}
                    km
                  </strong>
                </p>

                <p>
                  Fare ({rideRes?.vehicleType || vehicleType}):{" "}
                  <strong>
                    ₹
                    {Math.round(
                      Number(rideRes?.fare ?? estimate?.fare ?? 0)
                    )}
                  </strong>
                </p>

                {estimating && <p>Calculating fare...</p>}
              </div>
            )}

          {rideRes && (
            <div className="rr-info-card rr-spacing-top">
              <h3>Ride Created</h3>
              <p>
                Ride ID: <strong>{rideRes.rideId}</strong>
              </p>
              <p>
                Status: <strong>{rideRes.status}</strong>
              </p>
              <p>
                Vehicle: <strong>{rideRes.vehicleType}</strong>
              </p>
              <p>
                Distance:{" "}
                <strong>
                  {Number(rideRes?.distanceKm ?? 0).toFixed(2)} km
                </strong>
              </p>
              <p>
                Fare:{" "}
                <strong>₹{Math.round(Number(rideRes?.fare ?? 0))}</strong>
              </p>
            </div>
          )}

          <div className="rr-driver-section">
            <h3>Live Drivers</h3>

            <div className="rr-driver-list">
              {drivers.length === 0 ? (
                <div className="rr-helper-text">No drivers visible</div>
              ) : (
                drivers.map((d) => (
                  <div className="rr-driver-card" key={d.id}>
                    <p className="rr-driver-name">
                      {d.name ?? `Driver ${d.id}`}
                    </p>
                    <p>
                      {d.vehicleType ?? d.vehicle ?? "Vehicle"} •{" "}
                      {d.status ?? DEFAULT_STATUS}
                    </p>
                    <p>
                      {Number(d.latitude).toFixed(5)},{" "}
                      {Number(d.longitude).toFixed(5)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <p className="rr-helper-text rr-spacing-top-sm">
            Tip: You can also set pickup and drop by clicking on the map.
          </p>
        </div>

        <div className="rr-map-card">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={15}
            center={pickup || currentPosition}
            onLoad={onMapLoad}
            onClick={handleMapClick}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              clickableIcons: false,
            }}
          >
            {directions && <DirectionsRenderer directions={directions} />}

            {currentPosition && <Marker position={currentPosition} title="You" />}

            {pickup && (
              <Marker
                position={pickup}
                title="Pickup"
                icon={pickupIcon || undefined}
              />
            )}

            {drop && (
              <Marker
                position={drop}
                title="Drop"
                icon={dropIcon || undefined}
              />
            )}

            {drivers.map((driver) => (
              <Marker
                key={driver.id}
                position={{ lat: driver.latitude, lng: driver.longitude }}
                title={driver.name ?? `Driver ${driver.id}`}
                icon={driverIcon || undefined}
              />
            ))}
          </GoogleMap>
        </div>
      </section>
    </div>
  );
};

export default RideRequest;