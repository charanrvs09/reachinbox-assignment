import { useEffect, useState } from "react";
import {
  Routes,
  Route,
} from "react-router-dom";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import EmailTabs from "./components/EmailTabs";
import EmailTable from "./components/EmailTable";
import ComposeEmail from "./components/ComposeEmail";
import SearchBar from "./components/SearchBar";
import SlackConnect from "./components/SlackConnect";
import ProtectedRoute from "./components/ProtectedRoute";

import AuthCallback from "./pages/AuthCallback";
import Login from "./pages/Login";

import api from "./services/api";

interface Email {
  id: string;
  recipient: string;
  subject: string;
  scheduledAt: string;
  sentAt?: string | null;
  status:
    | "SCHEDULED"
    | "PROCESSING"
    | "SENT"
    | "FAILED";
}

function Dashboard() {
  const [
    activeTab,
    setActiveTab,
  ] = useState<"scheduled" | "sent">(
    "scheduled"
  );

  const [emails, setEmails] =
    useState<Email[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [
    showCompose,
    setShowCompose,
  ] = useState(false);

  const [
    isSearching,
    setIsSearching,
  ] = useState(false);

  const handleSectionChange = (
    section: string
  ) => {
    if (section === "scheduled") {
      setIsSearching(false);
      setActiveTab("scheduled");
    }

    if (section === "sent") {
      setIsSearching(false);
      setActiveTab("sent");
    }

    if (section === "search") {
      setIsSearching(false);

      window.setTimeout(() => {
        const searchInput =
          document.querySelector(
            'input[placeholder="Search emails..."]'
          ) as HTMLInputElement | null;

        searchInput?.focus();
      }, 50);
    }

    if (section === "dashboard") {
      setIsSearching(false);
      setActiveTab("scheduled");
    }
  };

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        setIsSearching(false);

        const endpoint =
          activeTab === "scheduled"
            ? "/emails/scheduled"
            : "/emails/sent";

        const token =
          localStorage.getItem(
            "reachinbox_token"
          );

        const response = await api.get(
          endpoint,
          token
            ? {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            : undefined
        );

        setEmails(
          response.data.emails
        );
      } catch (error) {
        console.error(
          "Failed to fetch emails:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [activeTab]);

  const scheduledCount =
    emails.filter(
      (email) =>
        email.status === "SCHEDULED"
    ).length;

  const sentCount =
    emails.filter(
      (email) =>
        email.status === "SENT"
    ).length;

  const failedCount =
    emails.filter(
      (email) =>
        email.status === "FAILED"
    ).length;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <Sidebar
          activeSection={
            activeTab === "scheduled"
              ? "scheduled"
              : "sent"
          }
          onSectionChange={
            handleSectionChange
          }
        />

        {/* Main area */}
        <div className="min-w-0 flex-1">
          <Header />

          {/* Slack status */}
          <div className="mx-auto max-w-7xl px-6 pt-5 lg:px-8">
            <div className="flex justify-end">
              <SlackConnect />
            </div>
          </div>

          <main className="mx-auto max-w-7xl px-6 py-7 lg:px-8">

            {/* Page heading */}
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Workspace
                </p>

                <h2 className="mt-1 text-3xl font-semibold tracking-tight text-gray-950">
                  Email Dashboard
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Schedule, send and manage your email campaigns.
                </p>
              </div>

              {/* Main compose button */}
              <button
                type="button"
                onClick={() =>
                  setShowCompose(true)
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
              >
                <span className="text-base">
                  +
                </span>

                Compose Email
              </button>
            </div>

            {/* Statistics */}
            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">

              {/* Scheduled */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <p className="text-sm text-gray-500">
                  Scheduled
                </p>

                <p className="mt-2 text-2xl font-semibold text-gray-950">
                  {scheduledCount}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Waiting to be sent
                </p>
              </div>

              {/* Sent */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <p className="text-sm text-gray-500">
                  Sent
                </p>

                <p className="mt-2 text-2xl font-semibold text-gray-950">
                  {sentCount}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Successfully delivered
                </p>
              </div>

              {/* Failed */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <p className="text-sm text-gray-500">
                  Failed
                </p>

                <p className="mt-2 text-2xl font-semibold text-gray-950">
                  {failedCount}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Requiring attention
                </p>
              </div>

            </div>

            {/* Search */}
            <div className="mt-7 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <SearchBar
                onResults={(results) => {
                  setEmails(results);
                  setIsSearching(true);
                }}
                onClear={() => {
                  setIsSearching(false);
                }}
              />
            </div>

            {/* Tabs */}
            <div className="mt-7">
              <EmailTabs
                activeTab={activeTab}
                onTabChange={(tab) => {
                  setIsSearching(false);
                  setActiveTab(tab);
                }}
              />

              {/* Table */}
              <div className="mt-4">
                {loading ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                    <p className="text-sm text-gray-500">
                      Loading emails...
                    </p>
                  </div>
                ) : emails.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-lg">
                      ✉
                    </div>

                    <p className="mt-4 text-sm font-medium text-gray-900">
                      {isSearching
                        ? "No emails found"
                        : activeTab === "scheduled"
                        ? "No scheduled emails"
                        : "No sent emails"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {isSearching
                        ? "Try a different search term."
                        : "Your emails will appear here."}
                    </p>

                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <EmailTable
                      emails={emails}
                      type={activeTab}
                    />
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Compose modal */}
      {showCompose && (
        <ComposeEmail
          onClose={() =>
            setShowCompose(false)
          }
          onScheduled={() => {
            setShowCompose(false);
            setActiveTab("scheduled");
          }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Routes>

      {/* Google OAuth callback */}
      <Route
        path="/auth/callback"
        element={
          <AuthCallback />
        }
      />

      {/* Login */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* Protected application */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App;