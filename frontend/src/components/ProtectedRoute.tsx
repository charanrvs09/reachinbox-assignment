import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../services/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const [checking, setChecking] =
    useState(true);

  const [authenticated, setAuthenticated] =
    useState(false);

  useEffect(() => {
    const verifySession = async () => {
      const token =
        localStorage.getItem(
          "reachinbox_token"
        );

      if (!token) {
        setAuthenticated(false);
        setChecking(false);
        return;
      }

      try {
        await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAuthenticated(true);
      } catch (error) {
        console.error(
          "Session verification failed:",
          error
        );

        localStorage.removeItem(
          "reachinbox_token"
        );

        localStorage.removeItem(
          "reachinbox_user"
        );

        setAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };

    verifySession();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">
          Checking authentication...
        </p>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;