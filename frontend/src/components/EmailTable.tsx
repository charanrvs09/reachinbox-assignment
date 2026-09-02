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
  
  interface EmailTableProps {
    emails: Email[];
    type: "scheduled" | "sent";
  }
  
  function getInitials(
    email: string
  ) {
    return email
      .slice(0, 2)
      .toUpperCase();
  }
  
  function formatDate(
    value: string
  ) {
    const date = new Date(value);
  
    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    ).format(date);
  }
  
  function StatusBadge({
    status,
  }: {
    status: Email["status"];
  }) {
    const styles = {
      SCHEDULED:
        "bg-blue-50 text-blue-700 ring-blue-100",
      PROCESSING:
        "bg-amber-50 text-amber-700 ring-amber-100",
      SENT:
        "bg-emerald-50 text-emerald-700 ring-emerald-100",
      FAILED:
        "bg-red-50 text-red-700 ring-red-100",
    };
  
    const labels = {
      SCHEDULED: "Scheduled",
      PROCESSING: "Processing",
      SENT: "Sent",
      FAILED: "Failed",
    };
  
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
  
        {labels[status]}
      </span>
    );
  }
  
  function EmailTable({
    emails,
    type,
  }: EmailTableProps) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Recipient
              </th>
  
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Subject
              </th>
  
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {type === "scheduled"
                  ? "Scheduled for"
                  : "Sent at"}
              </th>
  
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>
            </tr>
          </thead>
  
          <tbody className="divide-y divide-gray-100">
            {emails.map((email) => {
              const date =
                type === "scheduled"
                  ? email.scheduledAt
                  : email.sentAt ||
                    email.scheduledAt;
  
              return (
                <tr
                  key={email.id}
                  className="group transition hover:bg-gray-50/80"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {getInitials(
                          email.recipient
                        )}
                      </div>
  
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {email.recipient}
                        </p>
  
                        <p className="mt-0.5 text-xs text-gray-400">
                          Email recipient
                        </p>
                      </div>
                    </div>
                  </td>
  
                  <td className="px-6 py-4">
                    <p className="max-w-[260px] truncate text-sm font-medium text-gray-800">
                      {email.subject}
                    </p>
                  </td>
  
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">
                      {formatDate(date)}
                    </p>
                  </td>
  
                  <td className="px-6 py-4">
                    <StatusBadge
                      status={email.status}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
  
  export default EmailTable;