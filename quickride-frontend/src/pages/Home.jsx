import { Link } from "react-router-dom";
import "../styles/Home.css";
import Navbar from "../components/Navbar.jsx";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 17.385044,
  lng: 78.486671,
};

function Home() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAzC2NZ5fdQBv7h8S6XgPdxF4wmULA48KQ",
  });

  return (
    <div className="home-page">
      <Navbar />

      <section className="hero-section">
        <div className="hero-left">
          <p className="hero-tag">QuickRide for Hyderabad</p>
          <h1>Go anywhere with QuickRide</h1>
          <p className="hero-subtitle">
            Request a ride, travel comfortably, and move across the city with
            confidence. Fast pickups, smooth tracking, and a clean experience.
          </p>

          <div className="hero-buttons">
            <Link to="/signup?role=user" className="hero-btn primary-btn">
              Ride with QuickRide
            </Link>

            <Link to="/signup?role=driver" className="hero-btn secondary-btn">
              Become a Driver
            </Link>
          </div>

          <div className="hero-login-text">
            Already have an account?
            <Link to="/login" className="hero-login-link">
              {" "}
              Login
            </Link>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-map-card">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={12}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                }}
              />
            ) : (
              <div className="map-loading">Loading map...</div>
            )}
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="info-card">
          <h3>Book in seconds</h3>
          <p>
            Open the app, choose pickup and drop, and request your ride without
            confusion.
          </p>
        </div>

        <div className="info-card">
          <h3>Track your driver</h3>
          <p>
            See ride status, assigned driver, fare, and the full trip flow in
            one place.
          </p>
        </div>

        <div className="info-card">
          <h3>Drive and earn</h3>
          <p>
            Accept nearby rides, manage trips, and grow your earnings with a
            simple driver dashboard.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Home;