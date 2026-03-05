import {
  Clock3,
  Database,
  FileOutput,
  Image,
  ListFilter,
  MessageSquare,
  Palette,
  Search,
  ChevronDown,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";

type Props = {
  onAddDataSourceClick?: () => void;
};

type PluginsPage = "updates" | "installed" | "settings";

const topMenus = ["File", "Edit", "View", "Tools", "Window", "Help"];
const daisyThemes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
  "caramellatte",
  "abyss",
  "silk",
];

const TopToolbar = ({ onAddDataSourceClick }: Props) => {
  const [selectedTheme, setSelectedTheme] = useState("light");
  const [isPluginsModalOpen, setIsPluginsModalOpen] = useState(false);
  const [pluginsPage, setPluginsPage] = useState<PluginsPage>("updates");

  useEffect(() => {
    const savedTheme = localStorage.getItem("cultivator-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    setSelectedTheme(savedTheme);
  }, []);

  const handleThemeChange = (theme: string) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cultivator-theme", theme);
    setSelectedTheme(theme);
  };

  const openPluginsModal = () => {
    setPluginsPage("updates");
    setIsPluginsModalOpen(true);
  };

  const closePluginsModal = () => {
    setIsPluginsModalOpen(false);
  };

  return (
    <>
      <header className="relative z-[200] overflow-visible border-b border-base-300 bg-base-100/95 backdrop-blur">
        <div className="relative z-[230] border-b border-base-300 px-4">
          <nav className="flex h-9 items-center gap-1 overflow-visible" aria-label="Main menu">
            {topMenus.map((menu) =>
              menu === "Tools" ? (
                <div key={menu} className="dropdown dropdown-bottom">
                  <button
                    type="button"
                    tabIndex={0}
                    className="rounded-md px-2 py-1 text-sm text-base-content/80 transition hover:bg-base-200 hover:text-base-content"
                  >
                    {menu}
                  </button>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu z-[9999] mt-2 w-52 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
                  >
                    <li>
                      <button type="button" onClick={openPluginsModal}>
                        Plugins
                      </button>
                    </li>
                    <li>
                      <button type="button">Python Plugins</button>
                    </li>
                  </ul>
                </div>
              ) : (
                <button
                  key={menu}
                  type="button"
                  className="rounded-md px-2 py-1 text-sm text-base-content/80 transition hover:bg-base-200 hover:text-base-content"
                >
                  {menu}
                </button>
              ),
            )}
          </nav>
        </div>

        <div className="relative z-[210] flex min-h-16 flex-wrap items-center gap-2 overflow-visible px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,0.12)]" />
            <h1 className="text-lg font-bold tracking-wide text-base-content">
              Cultivator
            </h1>
          </div>

          <div className="tabs tabs-boxed tabs-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `tab ${isActive ? "tab-active" : ""}`}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/artifacts"
              className={({ isActive }) => `tab ${isActive ? "tab-active" : ""}`}
            >
              Artifacts
            </NavLink>
          </div>

          <div className="order-4 flex w-full flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/70 p-1 xl:order-none xl:w-auto">
            {onAddDataSourceClick ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-white hover:shadow-sm sm:px-2.5 sm:py-1.5 sm:text-sm"
                onClick={onAddDataSourceClick}
              >
                <Database size={16} />
                Add Data Source
              </button>
            ) : null}
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-white hover:shadow-sm sm:px-2.5 sm:py-1.5 sm:text-sm"
            >
              <Image size={16} />
              Images/Videos
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-white hover:shadow-sm sm:px-2.5 sm:py-1.5 sm:text-sm"
            >
              <MessageSquare size={16} />
              Communications
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-white hover:shadow-sm sm:px-2.5 sm:py-1.5 sm:text-sm"
            >
              <Clock3 size={16} />
              Timeline
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white transition hover:bg-slate-800 sm:px-2.5 sm:py-1.5 sm:text-sm"
            >
              <FileOutput size={16} />
              Generate Report
            </button>
          </div>
          <div className="dropdown dropdown-end relative z-[220]">
            <button type="button" tabIndex={0} className="btn btn-sm btn-outline gap-1.5">
              <Palette size={16} />
              {selectedTheme}
              <ChevronDown size={14} />
            </button>

            <div
              tabIndex={0}
              className="dropdown-content z-[9999] mt-2 w-[min(42rem,calc(100vw-2rem))] rounded-box bg-base-100 p-3 shadow-xl ring-1 ring-base-300"
            >
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60">
                Themes
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {daisyThemes.map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    className={`rounded-md border px-2 py-1.5 text-left text-xs transition ${
                      selectedTheme === theme
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-base-300 hover:bg-base-200"
                    }`}
                    onClick={() => handleThemeChange(theme)}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:px-2.5 sm:py-1.5 sm:text-sm"
            >
              <ListFilter size={16} />
              Keyword Lists
            </button>

            <label className="flex min-w-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-500 shadow-sm transition focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200 sm:px-2.5 sm:py-1.5">
              <Search size={15} />
              <input
                placeholder="Keyword Search..."
                className="w-32 border-none bg-transparent text-xs text-slate-700 outline-none sm:w-48 sm:text-sm"
              />
            </label>
          </div>
        </div>
      </header>

      {isPluginsModalOpen
        ? createPortal(
            <dialog className="modal modal-open z-[99999]" open>
              <div className="modal-box max-w-4xl p-0">
                <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
                  <h3 className="text-lg font-semibold">Plugins</h3>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-circle"
                    onClick={closePluginsModal}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="border-b border-base-300 px-5 py-3">
                  <div className="tabs tabs-box">
                    <button
                      type="button"
                      className={`tab ${pluginsPage === "updates" ? "tab-active" : ""}`}
                      onClick={() => setPluginsPage("updates")}
                    >
                      Updates
                    </button>
                    <button
                      type="button"
                      className={`tab ${pluginsPage === "installed" ? "tab-active" : ""}`}
                      onClick={() => setPluginsPage("installed")}
                    >
                      Installed
                    </button>
                    <button
                      type="button"
                      className={`tab ${pluginsPage === "settings" ? "tab-active" : ""}`}
                      onClick={() => setPluginsPage("settings")}
                    >
                      Settings
                    </button>
                  </div>
                </div>

                <div className="space-y-4 px-5 py-5">
                  {pluginsPage === "updates" ? (
                    <section className="space-y-3">
                      <p className="text-sm text-base-content/70">
                        Check for plugin updates and apply available updates.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="btn btn-primary btn-sm">
                          Check for Updates
                        </button>
                        <button type="button" className="btn btn-outline btn-sm">
                          Update All
                        </button>
                      </div>
                      <div className="rounded-box border border-base-300 bg-base-200/30 p-3 text-sm text-base-content/70">
                        No plugin updates available.
                      </div>
                    </section>
                  ) : null}

                  {pluginsPage === "installed" ? (
                    <section className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="btn btn-primary btn-sm">
                          Add New Plugin
                        </button>
                        <button type="button" className="btn btn-outline btn-sm">
                          Remove Plugin
                        </button>
                      </div>
                      <div className="rounded-box border border-base-300 bg-base-200/30 p-3">
                        <div className="font-semibold">Core Plugin Bundle</div>
                        <div className="text-xs text-base-content/70">Version 1.0.0</div>
                      </div>
                    </section>
                  ) : null}

                  {pluginsPage === "settings" ? (
                    <section className="space-y-3">
                      <label className="label cursor-pointer justify-start gap-3 rounded-box border border-base-300 px-3 py-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="checkbox checkbox-sm"
                        />
                        <span className="label-text">Enable plugin auto updates</span>
                      </label>
                      <label className="label cursor-pointer justify-start gap-3 rounded-box border border-base-300 px-3 py-2">
                        <input type="checkbox" className="checkbox checkbox-sm" />
                        <span className="label-text">Enable plugin signature checks</span>
                      </label>
                    </section>
                  ) : null}
                </div>
              </div>

              <form method="dialog" className="modal-backdrop" onClick={closePluginsModal}>
                <button type="button">close</button>
              </form>
            </dialog>,
            document.body,
          )
        : null}
    </>
  );
};

export default TopToolbar;
