import { useEffect, useState } from "react";
import api from "../services/api";

function SlackConnect() {
  const [connected, setConnected] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [connecting, setConnecting] =
    useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.get(
          "/slack/status"
        );

        setConnected(
          response.data.connected
        );
      } catch (error) {
        console.error(
          "Failed to check Slack status:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  const handleConnect = () => {
    setConnecting(true);

    window.location.href =
      "http://localhost:5000/api/slack/connect";
  };

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className="rounded-lg border bg-white px-4 py-2 text-sm text-gray-400"
      >
        Checking Slack...
      </button>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

        <span className="text-sm font-medium text-gray-700">
          Slack Connected
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={connecting}
      className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {connecting
        ? "Connecting..."
        : "Connect Slack"}
    </button>
  );
}

export default SlackConnect;