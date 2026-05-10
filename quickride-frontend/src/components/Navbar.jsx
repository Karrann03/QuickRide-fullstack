import { Link, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          QuickRide
        </Link>

        <div className="navbar-links">
          <Link
            to="/"
            className={location.pathname === "/" ? "nav-link active" : "nav-link"}
          >
            Home
          </Link>

          <Link
            to="/login"
            className={location.pathname === "/login" ? "nav-link active" : "nav-link"}
          >
            Login
          </Link>

          <Link
            to="/signup?role=user"
            className={
              location.pathname === "/signup" ? "nav-link nav-signup active" : "nav-link nav-signup"
            }
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;