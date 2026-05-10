import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role === "USER") {
      navigate("/user/dashboard");
    } else if (token && role === "DRIVER") {
      navigate("/driver/dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogleLoginUser = () => {
    window.location.href = "http://localhost:7973/auth/google/user/login";
  };

  const handleGoogleLoginDriver = () => {
    window.location.href = "http://localhost:7973/auth/google/driver/login";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:7973/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      localStorage.removeItem("activeRide");
      localStorage.removeItem("activeRideId");
      localStorage.removeItem("currentRide");

      if (data.role === "USER") {
        const userId = data.id || data.userId || data.user?.id;

        login({
          token: data.token,
          role: "USER",
          userId: String(userId),
        });

        navigate("/user/dashboard");
      } else if (data.role === "DRIVER") {
        const driverId = data.id || data.driverId || data.driver?.id;

        login({
          token: data.token,
          role: "DRIVER",
          driverId: String(driverId),
        });

        navigate("/driver/dashboard");
      }
    } catch (err) {
      console.error(err);
      alert("Login failed: " + err.message);
    }
  };

  return (
    <div className="uber-login-page">

      {/* NAVBAR */}
      <nav className="uber-navbar">
        <div className="uber-logo">QuickRide</div>

        <div className="uber-nav-links">
          <Link to="/">Home</Link>
          <Link to="/signup">Sign Up</Link>
        </div>
      </nav>

      {/* MAIN */}
      <div className="uber-login-container">

        {/* LEFT SIDE */}
        <div className="uber-login-left">
          <h1>Welcome back</h1>
          <p>Log in to continue your journey with QuickRide</p>

          <ul>
            <li>✔ Track your rides in real time</li>
            <li>✔ View driver & fare details</li>
            <li>✔ Smooth and secure experience</li>
          </ul>
        </div>

        {/* RIGHT SIDE */}
        <div className="uber-login-card">
          <h2>Login</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <button type="submit" className="btn-black">
              Continue
            </button>
          </form>

          <div className="divider">OR</div>

          <button className="btn-outline" onClick={handleGoogleLoginUser}>
            Continue with Google (Rider)
          </button>

          <button className="btn-outline" onClick={handleGoogleLoginDriver}>
            Continue with Google (Driver)
          </button>

          <p className="signup-text">
            Don’t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;