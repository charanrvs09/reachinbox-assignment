import { useState } from "react";
import api from "../services/api";
import LeadUpload from "./LeadUpload";

interface ComposeEmailProps {
  onClose: () => void;
  onScheduled: () => void;
}

function ComposeEmail({
  onClose,
  onScheduled,
}: ComposeEmailProps) {
  const [recipient, setRecipient] =
    useState("");

  const [sender, setSender] =
    useState("");

  const [subject, setSubject] =
    useState("");

  const [body, setBody] =
    useState("");

  const [scheduledAt, setScheduledAt] =
    useState("");

  const [delay, setDelay] =
    useState("0");

  const [hourlyLimit, setHourlyLimit] =
    useState("100");

  const [leadEmails, setLeadEmails] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const recipients =
        leadEmails.length > 0
          ? leadEmails
          : [recipient];

      await api.post(
        "/emails/schedule",
        {
          recipients,
          sender,
          subject,
          body,
          scheduledAt: new Date(
            scheduledAt
          ).toISOString(),
          delay: Number(delay),
          hourlyLimit:
            Number(hourlyLimit),
        }
      );

      onScheduled();
      onClose();
    } catch (error: any) {
      console.error(
        "Failed to schedule email:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to schedule email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm">

      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-lg text-white shadow-sm">
              ✉
            </div>

            <div>
              <h2 className="text-lg font-semibold tracking-tight text-gray-950">
                Compose Email
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Create and schedule your email campaign
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto"
        >
          <div className="space-y-6 p-6">

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                  !
                </div>

                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* Recipients */}
            <section>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Recipients
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Choose an individual recipient or upload a lead list.
                </p>
              </div>

              <LeadUpload
                onEmailsParsed={(emails) => {
                  setLeadEmails(
                    emails
                  );
                }}
              />

              {leadEmails.length >
                0 && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs text-green-700">
                      ✓
                    </span>

                    <span className="text-sm font-medium text-green-800">
                      Lead list loaded
                    </span>
                  </div>

                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-green-700">
                    {leadEmails.length}{" "}
                    {leadEmails.length ===
                    1
                      ? "lead"
                      : "leads"}
                  </span>
                </div>
              )}

              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Recipient Email
                </label>

                <input
                  type="email"
                  value={recipient}
                  onChange={(event) =>
                    setRecipient(
                      event.target.value
                    )
                  }
                  placeholder={
                    leadEmails.length >
                    0
                      ? "Optional when using a lead file"
                      : "recipient@example.com"
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100"
                  required={
                    leadEmails.length ===
                    0
                  }
                />

                {leadEmails.length >
                  0 && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    Individual recipient is optional because your lead file contains the recipients.
                  </p>
                )}
              </div>
            </section>

            {/* Email details */}
            <section className="border-t border-gray-100 pt-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Email Details
                </h3>
              </div>

              <div className="space-y-4">

                {/* Sender */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    From
                  </label>

                  <input
                    type="email"
                    value={sender}
                    onChange={(event) =>
                      setSender(
                        event.target.value
                      )
                    }
                    placeholder="sender@example.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100"
                    required
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Subject
                  </label>

                  <input
                    type="text"
                    value={subject}
                    onChange={(event) =>
                      setSubject(
                        event.target.value
                      )
                    }
                    placeholder="What's this email about?"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100"
                    required
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Message
                  </label>

                  <textarea
                    value={body}
                    onChange={(event) =>
                      setBody(
                        event.target.value
                      )
                    }
                    placeholder="Write your email message..."
                    rows={7}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100"
                    required
                  />

                  <p className="mt-1.5 text-right text-xs text-gray-400">
                    {body.length} characters
                  </p>
                </div>
              </div>
            </section>

            {/* Scheduling */}
            <section className="border-t border-gray-100 pt-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Delivery Settings
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Control when and how your emails are delivered.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                {/* Schedule */}
                <div className="md:col-span-3">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Schedule Time
                  </label>

                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) =>
                      setScheduledAt(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100"
                    required
                  />
                </div>

                {/* Delay */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Delay Between Sends
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={delay}
                      onChange={(event) =>
                        setDelay(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-20 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100"
                      required
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      seconds
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-gray-400">
                    Time between each send.
                  </p>
                </div>

                {/* Hourly limit */}
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Hourly Sending Limit
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={
                        hourlyLimit
                      }
                      onChange={(
                        event
                      ) =>
                        setHourlyLimit(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-28 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100"
                      required
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      emails / hour
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-gray-400">
                    Maximum emails allowed from this sender per hour.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/70 px-6 py-4">

            <p className="hidden text-xs text-gray-400 sm:block">
              Your campaign will be added to the delivery queue.
            </p>

            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Scheduling...
                  </>
                ) : (
                  <>
                    Schedule Email

                    <span className="text-base">
                      →
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ComposeEmail;