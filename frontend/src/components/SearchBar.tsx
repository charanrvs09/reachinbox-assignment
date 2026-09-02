import { useState } from "react";
import api from "../services/api";

interface SearchResult {
  id: string;
  recipient: string;
  sender?: string;
  subject: string;
  body?: string;
  scheduledAt: string;
  sentAt?: string | null;
  status:
  | "SCHEDULED"
  | "PROCESSING"
  | "SENT"
  | "FAILED";
}

interface SearchBarProps {
  onResults: (emails: SearchResult[]) => void;
  onClear: () => void;
}

function SearchBar({
  onResults,
  onClear,
}: SearchBarProps) {
  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSearch = async () => {
    const trimmedQuery =
      query.trim();

    if (!trimmedQuery) {
      onClear();
      return;
    }

    try {
      setLoading(true);

      const response = await api.get(
        "/search/emails",
        {
          params: {
            q: trimmedQuery,
          },
        }
      );

      onResults(
        response.data.emails
      );
    } catch (error) {
      console.error(
        "Search failed:",
        error
      );

      onResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery("");
    onClear();
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(event) =>
          setQuery(event.target.value)
        }
        onKeyDown={handleKeyDown}
        placeholder="Search emails..."
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-500"
      />

      <button
        type="button"
        onClick={handleSearch}
        disabled={loading}
        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default SearchBar;