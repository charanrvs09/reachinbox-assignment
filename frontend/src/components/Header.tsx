import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

function Header() {
  const navigate = useNavigate();

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [avatarError, setAvatarError] =
    useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token =
          localStorage.getItem(
            "reachinbox_token"
          );

        if (!token) {
          setLoading(false);
          return;
        }

        const response =
          await api.get(
            "/auth/me",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        setUser(
          response.data.user
        );

        localStorage.setItem(
          "reachinbox_user",
          JSON.stringify(
            response.data.user
          )
        );
      } catch (error) {
        console.error(
          "Failed to fetch user:",
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
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const token =
        localStorage.getItem(
          "reachinbox_token"
        );

      if (token) {
        await api.post(
          "/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
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
  };

  const initials =
    user?.name
      ? user.name
          .split(" ")
          .filter(Boolean)
          .map(
            (part) =>
              part[0]
          )
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "U";

  const showAvatar =
    Boolean(user?.avatarUrl) &&
    !avatarError;

  return (
    <header className="h-16 border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between px-6 lg:px-8">

        {/* Current section */}
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Dashboard
          </p>

          <p className="text-xs text-gray-400">
            Email workspace
          </p>
        </div>

        {/* User area */}
        <div className="flex items-center gap-3">

          {showAvatar ? (
            <img
              src={user!.avatarUrl!}
              alt={`${user!.name}'s profile`}
              onError={() =>
                setAvatarError(
                  true
                )
              }
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-950 text-sm font-semibold text-white">
              {initials}
            </div>
          )}

          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {loading
                ? "Loading..."
                : user?.name ||
                  "User"}
            </p>

            <p className="max-w-[180px] truncate text-xs text-gray-400">
              {user?.email ||
                "Not signed in"}
            </p>
          </div>

          <div className="ml-2 h-6 w-px bg-gray-200" />

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;