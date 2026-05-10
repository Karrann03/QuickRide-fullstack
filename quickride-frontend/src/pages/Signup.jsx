import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import "../styles/Signup.css";

function Signup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const role = searchParams.get("role") || "user";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    vehicleType: "SEDAN",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogleAuth = () => {
    const googleUrl =
      role === "driver"
        ? "http://localhost:7973/auth/google/driver/signup"
        : "http://localhost:7973/auth/google/user/signup";

    window.location.href = googleUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint =
        role === "driver"
          ? "http://localhost:7973/api/auth/driver/signup"
          : "http://localhost:7973/api/auth/user/signup";

      const payload =
        role === "driver"
          ? formData
          : {
              name: formData.name,
              email: formData.email,
              password: formData.password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      alert("Signup successful!");
      navigate(`/login?role=${role}`);
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <nav className="signup-navbar">
        <div className="signup-navbar-inner">
          <h2 className="logo">QuickRide</h2>

          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to={`/login?role=${role}`}>Login</Link>
          </div>
        </div>
      </nav>

      <div className="signup-main">
        <div className="signup-left">
          <div className="signup-brand">
            <h1>QuickRide</h1>
            <p>
              {role === "driver"
                ? "Start driving and earn on your schedule."
                : "Sign up and ride anywhere with ease."}
            </p>
          </div>
        </div>

        <div className="signup-right">
          <div className="signup-card">
            <h2>
              {role === "driver" ? "Sign up to drive" : "Create your account"}
            </h2>

            <p className="signup-subtext">
              {role === "driver"
                ? "Join QuickRide as a driver"
                : "Sign up to book rides with QuickRide"}
            </p>

            {error && <p className="signup-error">{error}</p>}

            <form onSubmit={handleSubmit} className="signup-form">
              <input
                type="text"
                name="name"
                placeholder="Full name"
                value={formData.name}
                onChange={handleChange}
                required
              />

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

              {role === "driver" && (
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                >
                  <option value="SEDAN">Sedan</option>
                  <option value="MINI_SUV">Mini SUV</option>
                  <option value="SUV">SUV</option>
                </select>
              )}

              <button
                type="submit"
                className="signup-btn-primary"
                disabled={loading}
              >
                {loading
                  ? "Creating..."
                  : role === "driver"
                  ? "Register as Driver"
                  : "Sign Up"}
              </button>
            </form>

            <div className="signup-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="signup-btn-google"
              onClick={handleGoogleAuth}
            >
              {role === "driver"
                ? "Continue with Google as Driver"
                : "Continue with Google"}
            </button>

            <p className="signup-footer-text">
              Already have an account?{" "}
              <Link to={`/login?role=${role}`}>Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;