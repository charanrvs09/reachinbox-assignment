interface EmailTabsProps {
    activeTab: "scheduled" | "sent";
    onTabChange: (
      tab: "scheduled" | "sent"
    ) => void;
  }
  
  function EmailTabs({
    activeTab,
    onTabChange,
  }: EmailTabsProps) {
    return (
      <div className="flex items-center border-b border-gray-200">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              onTabChange("scheduled")
            }
            className={`relative px-4 py-3 text-sm font-medium transition ${
              activeTab === "scheduled"
                ? "text-gray-950"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Scheduled
  
            {activeTab === "scheduled" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-gray-950" />
            )}
          </button>
  
          <button
            type="button"
            onClick={() =>
              onTabChange("sent")
            }
            className={`relative px-4 py-3 text-sm font-medium transition ${
              activeTab === "sent"
                ? "text-gray-950"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Sent
  
            {activeTab === "sent" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-gray-950" />
            )}
          </button>
        </div>
      </div>
    );
  }
  
  export default EmailTabs;