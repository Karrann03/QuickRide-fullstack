import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function OAuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const id = params.get("id");
    const name = params.get("name");
    const email = params.get("email");
    const role = params.get("role");
    const token = params.get("token");
    const mode = params.get("mode");

    if (!id || !role || !token) {
      navigate("/login");
      return;
    }

    localStorage.setItem(
      "user",
      JSON.stringify({ id, name, email, role, mode })
    );

    localStorage.removeItem("activeRide");
    localStorage.removeItem("currentRide");

    if (role === "USER") {
      login({
        token,
        role: "USER",
        userId: String(id),
      });

      navigate("/user/dashboard");
      return;
    }

    if (role === "DRIVER") {
      login({
        token,
        role: "DRIVER",
        driverId: String(id),
      });

      navigate("/driver/dashboard");
      return;
    }

    navigate("/");
  }, [location, navigate, login]);

  return <h2>Logging you in...</h2>;
}

export default OAuthSuccess;