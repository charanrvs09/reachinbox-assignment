import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function completeLogin() {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const token = params.get("token");

        if (!token) {
          throw new Error(
            "Authentication token is missing"
          );
        }

        localStorage.setItem(
          "reachinbox_token",
          token
        );

        const response = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        localStorage.setItem(
          "reachinbox_user",
          JSON.stringify(response.data.user)
        );

        navigate("/", {
          replace: true,
        });
      } catch (error) {
        console.error(
          "Google login failed:",
          error
        );

        localStorage.removeItem(
          "reachinbox_token"
        );

        localStorage.removeItem(
          "reachinbox_user"
        );

        navigate("/login", {
          replace: true,
        });
      }
    }

    completeLogin();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">
          Signing you in...
        </h2>

        <p className="mt-2 text-gray-500">
          Please wait while we complete Google login.
        </p>
      </div>
    </div>
  );
}