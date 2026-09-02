import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const token =
      localStorage.getItem("reachinbox_token");

    if (token) {
      navigate("/", {
        replace: true,
      });
    }
  }, [navigate]);

  const handleGoogleLogin = () => {
    window.location.href =
      "http://localhost:5000/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            ReachInbox
          </h1>

          <p className="mt-2 text-gray-500">
            Email Scheduler
          </p>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <span className="text-lg">
              G
            </span>

            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;