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
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

type Props = {
  onAddDataSourceClick?: () => void;
};

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

  return (
    <header className="relative z-[200] overflow-visible border-b border-base-300 bg-base-100/95 backdrop-blur">
      <div className="border-b border-base-300 px-4">
        <nav className="flex h-9 items-center gap-1" aria-label="Main menu">
          {topMenus.map((menu) => (
            <button
              key={menu}
              className="rounded-md px-2 py-1 text-sm text-base-content/80 transition hover:bg-base-200 hover:text-base-content"
            >
              {menu}
            </button>
          ))}
        </nav>
      </div>

      <div className="relative z-[210] flex min-h-16 items-center gap-3 overflow-visible px-4">
        <div className="flex min-w-40 items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,0.12)]" />
          <h1 className="text-lg font-bold tracking-wide text-base-content">
            Cultivator
          </h1>
        </div>

        <div className="tabs tabs-boxed">
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

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/70 p-1">
          {onAddDataSourceClick ? (
            <button
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white hover:shadow-sm"
              onClick={onAddDataSourceClick}
            >
              <Database size={16} />
              Add Data Source
            </button>
          ) : null}
          <button className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white hover:shadow-sm">
            <Image size={16} />
            Images/Videos
          </button>
          <button className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white hover:shadow-sm">
            <MessageSquare size={16} />
            Communications
          </button>
          <button className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white hover:shadow-sm">
            <Clock3 size={16} />
            Timeline
          </button>
          <button className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800">
            <FileOutput size={16} />
            Generate Report
          </button>
        </div>
        <div className="dropdown dropdown-end relative z-[220]">
          <button tabIndex={0} className="btn btn-sm btn-outline gap-1.5">
            <Palette size={16} />
            {selectedTheme}
            <ChevronDown size={14} />
          </button>

          <ul
            tabIndex={0}
            className="dropdown-content menu z-[9999] mt-2 max-h-80 w-52 overflow-auto rounded-box bg-base-100 p-2 shadow-xl ring-1 ring-base-300"
          >
            {daisyThemes.map((theme) => (
              <li key={theme}>
                <button
                  className={selectedTheme === theme ? "active" : ""}
                  onClick={() => handleThemeChange(theme)}
                >
                  {theme}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            <ListFilter size={16} />
            Keyword Lists
          </button>

          <label className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-slate-500 shadow-sm transition focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200">
            <Search size={15} />
            <input
              placeholder="Keyword Search..."
              className="w-48 border-none bg-transparent text-sm text-slate-700 outline-none"
            />
          </label>
        </div>
      </div>
    </header>
  );
};

export default TopToolbar;
