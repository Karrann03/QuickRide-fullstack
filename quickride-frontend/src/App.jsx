import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserDashboard from "./pages/UserDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import RideRequest from "./pages/RideRequest";
import DriverAvailableRides from "./pages/DriverAvailableRides";
import ProtectedRoute from "./components/ProtectedRoute";
import UserTrackRide from "./pages/UserTrackRide";
import OAuthSuccess from "./pages/OAuthSuccess";
import RideTracking from "./pages/RideTracking";
import DriverLiveRide from "./pages/DriverLiveRide";
import UserTrack from "./pages/UserTrackRide";
import { useEffect } from "react";

function App() {

  useEffect(() => {

    const forceScroll = () => {
      document.body.style.setProperty("overflow-y", "auto", "important");
      document.body.style.setProperty("overflow-x", "hidden", "important");
      document.body.style.setProperty("height", "auto", "important");

      document.documentElement.style.setProperty("overflow-y", "auto", "important");
      document.documentElement.style.setProperty("overflow-x", "hidden", "important");
      document.documentElement.style.setProperty("height", "auto", "important");

      const root = document.getElementById("root");
      if (root) {
        root.style.setProperty("overflow", "visible", "important");
        root.style.setProperty("height", "auto", "important");
        root.style.setProperty("min-height", "100vh", "important");
      }
    };

    forceScroll();

    // safety: har 1 sec me reset karega agar koi component dubara tod de
    const interval = setInterval(forceScroll, 1000);

    return () => clearInterval(interval);
  }, []);


  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/oauth-success" element={<OAuthSuccess />} />

      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute allowedRole="USER">
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/request-ride"
        element={
          <ProtectedRoute allowedRole="USER">
            <RideRequest />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ride-tracking"
        element={
          <ProtectedRoute allowedRole="USER">
            <RideTracking />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/track"
        element={
          <ProtectedRoute allowedRole="USER">
            <UserTrackRide />
          </ProtectedRoute>
        }
      />

      <Route
        path="/driver/dashboard"
        element={
          <ProtectedRoute allowedRole="DRIVER">
            <DriverDashboard />
          </ProtectedRoute>
        }
      />
        <Route path="/user/track" element={<UserTrack />} />
        <Route
  path="/driver/live-ride"
  element={
    <ProtectedRoute allowedRole="DRIVER">
      <DriverLiveRide />
    </ProtectedRoute>
  }
/>
      <Route
        path="/driver/available-rides"
        element={
          <ProtectedRoute allowedRole="DRIVER">
            <DriverAvailableRides />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;