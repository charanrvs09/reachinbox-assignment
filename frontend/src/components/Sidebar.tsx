interface SidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
  }
  
  function Sidebar({
    activeSection,
    onSectionChange,
  }: SidebarProps) {
    const menuItems = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "⌂",
      },
      {
        id: "scheduled",
        label: "Scheduled",
        icon: "◷",
      },
      {
        id: "sent",
        label: "Sent",
        icon: "✓",
      },
    ];
  
    return (
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center border-b border-gray-100 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-950 text-sm font-bold text-white">
            R
          </div>
  
          <div className="ml-3">
            <h1 className="text-base font-semibold tracking-tight text-gray-950">
              ReachInbox
            </h1>
  
            <p className="text-xs text-gray-500">
              Email Scheduler
            </p>
          </div>
        </div>
  
        {/* Navigation */}
        <nav className="flex-1 px-3 py-5">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Workspace
          </p>
  
          <div className="space-y-1">
            {menuItems.map((item) => {
              const active =
                activeSection === item.id;
  
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onSectionChange(item.id)
                  }
                  className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-gray-100 text-gray-950"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span
                    className={`mr-3 flex h-7 w-7 items-center justify-center rounded-md text-base ${
                      active
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-400"
                    }`}
                  >
                    {item.icon}
                  </span>
  
                  {item.label}
                </button>
              );
            })}
          </div>
  
          <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Tools
          </p>
  
          <button
            type="button"
            onClick={() =>
              onSectionChange("search")
            }
            className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              activeSection === "search"
                ? "bg-gray-100 text-gray-950"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="mr-3 flex h-7 w-7 items-center justify-center rounded-md text-base text-gray-400">
              ⌕
            </span>
  
            Search
          </button>
        </nav>
  
        {/* Bottom integration */}
        <div className="border-t border-gray-100 p-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
  
              <span className="text-sm font-medium text-gray-800">
                Slack Connected
              </span>
            </div>
  
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Notifications are enabled for your workspace.
            </p>
          </div>
        </div>
      </aside>
    );
  }
  
  export default Sidebar;