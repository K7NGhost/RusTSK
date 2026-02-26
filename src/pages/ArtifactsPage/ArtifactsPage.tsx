import { useEffect, useMemo, useState } from "react";
import {
  AppWindow,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Image,
  KeyRound,
  MapPin,
  MessageSquareText,
  Phone,
  PhoneCall,
  Play,
  Search,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import TopToolbar from "../DashboardPage/components/TopToolbar";
import reactLogo from "../../assets/react.svg";

type ArtifactKind = "Directory" | "Document" | "Image" | "Archive" | "Binary";
type ArtifactCategory =
  | "Contacts"
  | "Call Logs"
  | "Messages"
  | "Media"
  | "Browser History"
  | "Location"
  | "App Data"
  | "Accounts"
  | "Calendar"
  | "Documents"
  | "Other";
type ModelId = "all" | "people" | "communications" | "media_files" | "apps_web";
type DataMode = "test" | "real";
type MediaKind = "image" | "video";

type ArtifactRecord = {
  id: string;
  name: string;
  kind: ArtifactKind;
  source_path: string;
  status: string;
  inode: number;
};

type CategorizedArtifact = ArtifactRecord & { category: ArtifactCategory };
type MediaArtifact = CategorizedArtifact & { mediaKind: MediaKind; previewSrc: string };

type ContactDetails = {
  fullName: string;
  primaryNumber: string;
  secondaryNumber?: string;
  email?: string;
  account?: string;
  sourceApp?: string;
  lastInteraction?: string;
};

type MessageItem = {
  id: string;
  direction: "incoming" | "outgoing";
  sender: string;
  body: string;
  timestamp: string;
};

type DetailItem = { label: string; value: string };

const ResizeHandle = () => (
  <Separator
    style={{
      background: "hsl(var(--bc) / 0.18)",
      width: 6,
      height: "100%",
      cursor: "col-resize",
      borderRadius: 4,
      margin: "0 4px",
    }}
  />
);

const categoryMeta: Array<{ id: ArtifactCategory; icon: LucideIcon }> = [
  { id: "Contacts", icon: Users },
  { id: "Call Logs", icon: PhoneCall },
  { id: "Messages", icon: MessageSquareText },
  { id: "Media", icon: Image },
  { id: "Browser History", icon: Globe },
  { id: "Location", icon: MapPin },
  { id: "App Data", icon: AppWindow },
  { id: "Accounts", icon: KeyRound },
  { id: "Calendar", icon: CalendarDays },
  { id: "Documents", icon: FileText },
  { id: "Other", icon: Phone },
];

const models: Array<{ id: ModelId; title: string; categories: ArtifactCategory[] }> = [
  { id: "all", title: "All Models", categories: categoryMeta.map((item) => item.id) },
  { id: "people", title: "Identity & People", categories: ["Contacts", "Accounts", "Calendar"] },
  { id: "communications", title: "Communications", categories: ["Call Logs", "Messages"] },
  { id: "media_files", title: "Media & Files", categories: ["Media", "Documents", "Other"] },
  { id: "apps_web", title: "Apps, Web & Location", categories: ["App Data", "Browser History", "Location"] },
];

const testArtifacts: ArtifactRecord[] = [
  { id: "A-0001", name: "contacts_main.db", kind: "Binary", source_path: "/data/contacts", status: "Indexed", inode: 9011 },
  { id: "A-0015", name: "contact_jane_doe.vcf", kind: "Document", source_path: "/data/contacts", status: "Indexed", inode: 9025 },
  { id: "A-0002", name: "call_history.sqlite", kind: "Binary", source_path: "/data/calls", status: "Indexed", inode: 9012 },
  { id: "A-0003", name: "whatsapp_chat_store.db", kind: "Binary", source_path: "/apps/whatsapp", status: "Indexed", inode: 9013 },
  { id: "A-0004", name: "telegram_messages.sqlite", kind: "Binary", source_path: "/apps/telegram", status: "Indexed", inode: 9014 },
  { id: "A-0005", name: "dcim_camera_2026_02_01.jpg", kind: "Image", source_path: "/media/dcim/camera", status: "Indexed", inode: 9015 },
  { id: "A-0006", name: "video_capture_0210.mp4", kind: "Binary", source_path: "/media/videos", status: "Indexed", inode: 9016 },
  { id: "A-0007", name: "browser_history_chrome.db", kind: "Binary", source_path: "/apps/chrome", status: "Indexed", inode: 9017 },
  { id: "A-0008", name: "maps_location_cache.json", kind: "Document", source_path: "/apps/maps", status: "Indexed", inode: 9018 },
  { id: "A-0009", name: "calendar_events.sqlite", kind: "Binary", source_path: "/data/calendar", status: "Indexed", inode: 9019 },
  { id: "A-0010", name: "account_tokens.plist", kind: "Document", source_path: "/accounts", status: "Indexed", inode: 9020 },
  { id: "A-0011", name: "bank_statement_feb.pdf", kind: "Document", source_path: "/documents", status: "Indexed", inode: 9021 },
  { id: "A-0012", name: "installed_apps_manifest.json", kind: "Document", source_path: "/apps", status: "Indexed", inode: 9022 },
];

const contactDetailsByArtifactId: Record<string, ContactDetails> = {
  "A-0001": { fullName: "Primary Contacts Store", primaryNumber: "+1 (555) 240-0181", account: "iCloud", sourceApp: "Contacts", lastInteraction: "2026-02-25 19:41" },
  "A-0015": { fullName: "Jane Doe", primaryNumber: "+1 (555) 019-8802", secondaryNumber: "+1 (555) 019-4420", email: "jane.doe@example.com", account: "Google", sourceApp: "Contacts", lastInteraction: "2026-02-24 08:15" },
};

const messageThreadByArtifactId: Record<string, MessageItem[]> = {
  "A-0003": [
    { id: "W-1", direction: "incoming", sender: "Jane", body: "Did you make it back home?", timestamp: "2026-02-25 18:02" },
    { id: "W-2", direction: "outgoing", sender: "You", body: "Yeah, just parked. I can review those files tonight.", timestamp: "2026-02-25 18:05" },
    { id: "W-3", direction: "incoming", sender: "Jane", body: "Perfect. Send me the report in the morning.", timestamp: "2026-02-25 18:06" },
  ],
  "A-0004": [
    { id: "T-1", direction: "incoming", sender: "OpsGroup", body: "Reminder: preserve full extraction and chain-of-custody notes.", timestamp: "2026-02-26 09:11" },
    { id: "T-2", direction: "outgoing", sender: "You", body: "Acknowledged. Uploading package and metadata hash set now.", timestamp: "2026-02-26 09:14" },
  ],
};

const detailByArtifactId: Record<string, DetailItem[]> = {
  "A-0002": [
    { label: "Number", value: "+1 (555) 019-8802" },
    { label: "Direction", value: "Outgoing" },
    { label: "Duration", value: "00:04:26" },
    { label: "Timestamp", value: "2026-02-25 22:48" },
  ],
  "A-0007": [
    { label: "URL", value: "https://mail.example.com/inbox" },
    { label: "Title", value: "Inbox - Example Mail" },
    { label: "Visit Count", value: "11" },
  ],
  "A-0008": [
    { label: "Latitude", value: "37.7749" },
    { label: "Longitude", value: "-122.4194" },
    { label: "Address", value: "San Francisco, CA" },
  ],
  "A-0009": [
    { label: "Event", value: "Case Review Meeting" },
    { label: "Start", value: "2026-02-27 09:00" },
    { label: "End", value: "2026-02-27 10:00" },
  ],
  "A-0010": [
    { label: "Account Type", value: "Google" },
    { label: "Username", value: "user@example.com" },
    { label: "Status", value: "Active" },
  ],
  "A-0011": [
    { label: "Filename", value: "bank_statement_feb.pdf" },
    { label: "MIME", value: "application/pdf" },
    { label: "Size", value: "1.8 MB" },
  ],
};

const pickCategory = (artifact: ArtifactRecord): ArtifactCategory => {
  const text = `${artifact.name} ${artifact.source_path}`.toLowerCase();
  if (/(contact|addressbook|phonebook|people)/.test(text)) return "Contacts";
  if (/(call|dialer|voip|phonecall)/.test(text)) return "Call Logs";
  if (/(sms|mms|message|chat|whatsapp|telegram|signal)/.test(text)) return "Messages";
  if (/(jpg|jpeg|png|gif|bmp|mp4|mov|avi|heic|photo|video|camera|dcim)/.test(text)) return "Media";
  if (/(history|browser|chrome|safari|firefox|edge|cookie|cache|url)/.test(text)) return "Browser History";
  if (/(location|gps|geofence|route|coordinate|geotag)/.test(text)) return "Location";
  if (/(app|plist|sqlite|db|preferences|manifest)/.test(text)) return "App Data";
  if (/(account|token|auth|credential|login)/.test(text)) return "Accounts";
  if (/(calendar|event|reminder|schedule)/.test(text)) return "Calendar";
  if (artifact.kind === "Document") return "Documents";
  return "Other";
};

const getMediaKind = (name: string): MediaKind | null => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "heic"].includes(ext)) return "image";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  return null;
};

const ArtifactsPage = () => {
  const [dataMode, setDataMode] = useState<DataMode>("test");
  const [query, setQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelId>("all");
  const [selectedCategory, setSelectedCategory] = useState<ArtifactCategory | "All Categories">("All Categories");
  const [imagePath, setImagePath] = useState(localStorage.getItem("cultivator-active-image-path") ?? "");
  const [directoryPath, setDirectoryPath] = useState("/");
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<ArtifactRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
  const [selectedArtifactKey, setSelectedArtifactKey] = useState<string | null>(null);
  const [isControlCompact, setIsControlCompact] = useState(false);

  const loadArtifacts = async () => {
    if (!imagePath.trim()) {
      setErrorMessage("Set a disk image path first.");
      setRows([]);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const entries = await invoke<ArtifactRecord[]>("list_artifacts", {
        image_path: imagePath,
        offset,
        path: directoryPath,
      });
      setRows(entries);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dataMode === "test") {
      setRows(testArtifacts);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }
    void loadArtifacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataMode]);

  const categorizedRows = useMemo<CategorizedArtifact[]>(() => rows.map((row) => ({ ...row, category: pickCategory(row) })), [rows]);

  const modelCategorySet = useMemo(
    () => new Set(models.find((model) => model.id === selectedModel)?.categories ?? []),
    [selectedModel],
  );

  const modelFilteredRows = useMemo(
    () => categorizedRows.filter((row) => modelCategorySet.has(row.category)),
    [categorizedRows, modelCategorySet],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<ArtifactCategory, number> = {
      Contacts: 0,
      "Call Logs": 0,
      Messages: 0,
      Media: 0,
      "Browser History": 0,
      Location: 0,
      "App Data": 0,
      Accounts: 0,
      Calendar: 0,
      Documents: 0,
      Other: 0,
    };
    for (const row of modelFilteredRows) counts[row.category] += 1;
    return counts;
  }, [modelFilteredRows]);

  const filteredArtifacts = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return modelFilteredRows.filter((item) => {
      const matchesQuery =
        normalized.length === 0 ||
        item.name.toLowerCase().includes(normalized) ||
        item.id.toLowerCase().includes(normalized) ||
        String(item.inode).includes(normalized);
      const matchesCategory = selectedCategory === "All Categories" || item.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [modelFilteredRows, query, selectedCategory]);

  const mediaArtifacts = useMemo<MediaArtifact[]>(() => filteredArtifacts
    .filter((artifact) => artifact.category === "Media")
    .map((artifact) => ({ ...artifact, mediaKind: getMediaKind(artifact.name) ?? "image", previewSrc: reactLogo })), [filteredArtifacts]);

  const isPreviewCategory = selectedCategory !== "All Categories";

  useEffect(() => {
    if (!isPreviewCategory || filteredArtifacts.length === 0) {
      setSelectedArtifactKey(null);
      return;
    }
    const hasSelection = filteredArtifacts.some((artifact) => `${artifact.id}-${artifact.inode}` === selectedArtifactKey);
    if (!hasSelection) {
      setSelectedArtifactKey(`${filteredArtifacts[0].id}-${filteredArtifacts[0].inode}`);
    }
  }, [filteredArtifacts, isPreviewCategory, selectedArtifactKey]);

  const selectedArtifact = selectedArtifactKey === null ? null : filteredArtifacts.find((artifact) => `${artifact.id}-${artifact.inode}` === selectedArtifactKey) ?? null;

  const selectedContactDetails = selectedArtifact && selectedArtifact.category === "Contacts"
    ? contactDetailsByArtifactId[selectedArtifact.id] ?? { fullName: selectedArtifact.name, primaryNumber: "Unknown" }
    : null;

  const selectedMessageThread = selectedArtifact && selectedArtifact.category === "Messages"
    ? messageThreadByArtifactId[selectedArtifact.id] ?? []
    : [];

  const selectedGenericDetails: DetailItem[] = useMemo(() => {
    if (!selectedArtifact) return [];
    const seeded = detailByArtifactId[selectedArtifact.id];
    if (seeded) return seeded;
    return [
      { label: "Artifact ID", value: selectedArtifact.id },
      { label: "Name", value: selectedArtifact.name },
      { label: "Path", value: selectedArtifact.source_path },
      { label: "Inode", value: String(selectedArtifact.inode) },
      { label: "Status", value: selectedArtifact.status },
    ];
  }, [selectedArtifact]);

  useEffect(() => {
    if (activeMediaIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveMediaIndex(null);
      if (event.key === "ArrowLeft") {
        setActiveMediaIndex((prev) => (prev === null ? null : (prev - 1 + mediaArtifacts.length) % mediaArtifacts.length));
      }
      if (event.key === "ArrowRight") {
        setActiveMediaIndex((prev) => (prev === null ? null : (prev + 1) % mediaArtifacts.length));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeMediaIndex, mediaArtifacts.length]);

  const activeMedia = activeMediaIndex !== null ? mediaArtifacts[activeMediaIndex] : null;
  const showMediaPreview = selectedCategory === "Media" && mediaArtifacts.length > 0;

  useEffect(() => {
    if (!showMediaPreview) {
      setIsControlCompact(false);
    }
  }, [showMediaPreview]);

  return (
    <div className="flex h-screen flex-col bg-base-200/40">
      <TopToolbar />

      <main className="min-h-0 flex-1 p-4">
        <section className="flex h-full min-h-0 flex-col rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-base-content">Artifacts</h2>
            <span className="badge badge-neutral">{filteredArtifacts.length} shown</span>
            <div className="join ml-1">
              <button type="button" className={`btn join-item btn-sm ${dataMode === "test" ? "btn-primary" : "btn-outline"}`} onClick={() => setDataMode("test")}>Test Data</button>
              <button type="button" className={`btn join-item btn-sm ${dataMode === "real" ? "btn-primary" : "btn-outline"}`} onClick={() => setDataMode("real")}>Real Data</button>
            </div>
            <label className="ml-auto flex items-center gap-2 rounded-md border border-base-300 bg-base-100 px-3 py-2 text-base-content/60">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-52 border-none bg-transparent text-sm text-base-content outline-none" placeholder="Search ID, name, inode..." />
            </label>
          </div>

          {dataMode === "real" ? (
            <div className="mb-4 grid gap-3 rounded-lg border border-base-300 p-3 md:grid-cols-[1fr_160px_220px_auto]">
              <input className="input input-bordered input-sm w-full" value={imagePath} onChange={(event) => { const next = event.target.value; setImagePath(next); localStorage.setItem("cultivator-active-image-path", next); }} placeholder="Disk image path (e.g. C:\\evidence\\disk.E01)" />
              <input className="input input-bordered input-sm w-full" value={offset} onChange={(event) => setOffset(Number(event.target.value || 0))} type="number" min={0} placeholder="Offset" />
              <input className="input input-bordered input-sm w-full" value={directoryPath} onChange={(event) => setDirectoryPath(event.target.value)} placeholder="Filesystem path (e.g. /)" />
              <div className="flex gap-2">
                <button className="btn btn-outline btn-sm" type="button" onClick={async () => { const selected = await open({ multiple: false, directory: false, title: "Select disk image" }); if (typeof selected === "string") { setImagePath(selected); localStorage.setItem("cultivator-active-image-path", selected); } }}>Browse</button>
                <button className="btn btn-primary btn-sm" type="button" onClick={() => void loadArtifacts()} disabled={isLoading}>{isLoading ? "Loading..." : "Reload"}</button>
              </div>
            </div>
          ) : (
            <div className="alert mb-4 border border-base-300 bg-base-200/40 py-2 text-sm">Running in test mode with seeded mobile extraction artifacts.</div>
          )}

          {errorMessage ? <div className="alert alert-error mb-4 py-2 text-sm">{errorMessage}</div> : null}

          <div className="mb-4 grid gap-2 md:grid-cols-5">
            {models.map((model) => {
              const modelCount = categorizedRows.filter((row) => model.categories.includes(row.category)).length;
              return (
                <button key={model.id} type="button" onClick={() => { setSelectedModel(model.id); setSelectedCategory("All Categories"); }} className={`rounded-lg border text-left transition ${isControlCompact ? "p-2" : "p-3"} ${selectedModel === model.id ? "border-primary bg-primary/10" : "border-base-300 bg-base-100 hover:bg-base-200/60"}`}>
                  <div className="text-xs uppercase tracking-wide text-base-content/60">Model</div>
                  <div className={isControlCompact ? "text-xs font-semibold" : "text-sm font-semibold"}>{model.title}</div>
                  <div className={`${isControlCompact ? "mt-0.5" : "mt-1"} text-xs text-base-content/70`}>{modelCount} artifacts</div>
                </button>
              );
            })}
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <button type="button" className={`rounded-lg border text-left ${isControlCompact ? "p-2" : "p-3"} ${selectedCategory === "All Categories" ? "border-primary bg-primary/10" : "border-base-300 hover:bg-base-200/60"}`} onClick={() => setSelectedCategory("All Categories")}>
              <div className="text-xs uppercase tracking-wide text-base-content/60">Category</div>
              <div className={isControlCompact ? "text-xs font-semibold" : "text-sm font-semibold"}>All Categories</div>
              <div className={`${isControlCompact ? "mt-0.5" : "mt-1"} text-xs text-base-content/70`}>{modelFilteredRows.length} artifacts</div>
            </button>
            {categoryMeta.map((category) => {
              if (!modelCategorySet.has(category.id)) return null;
              const count = categoryCounts[category.id];
              if (count === 0) return null;
              const Icon = category.icon;
              return (
                <button key={category.id} type="button" className={`rounded-lg border text-left ${isControlCompact ? "p-2" : "p-3"} ${selectedCategory === category.id ? "border-primary bg-primary/10" : "border-base-300 hover:bg-base-200/60"}`} onClick={() => setSelectedCategory(category.id)}>
                  <div className={`${isControlCompact ? "mb-0.5" : "mb-1"} flex items-center gap-2`}><Icon size={14} /><span className={isControlCompact ? "text-xs font-semibold" : "text-sm font-semibold"}>{category.id}</span></div>
                  <div className="text-xs text-base-content/70">{count} artifacts</div>
                </button>
              );
            })}
          </div>

          {activeMedia ? (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-6">
              <div className="relative w-full max-w-5xl rounded-xl border border-base-300 bg-base-100 shadow-2xl">
                <button type="button" className="btn btn-sm btn-circle absolute right-3 top-3 z-10" onClick={() => setActiveMediaIndex(null)}><X size={14} /></button>
                <div className="grid min-h-[420px] md:grid-cols-[64px_1fr_64px]">
                  <button type="button" className="btn btn-ghost h-full rounded-none" onClick={() => setActiveMediaIndex((prev) => (prev === null ? null : (prev - 1 + mediaArtifacts.length) % mediaArtifacts.length))}><ChevronLeft size={22} /></button>
                  <div className="flex min-h-[420px] items-center justify-center bg-base-200 p-4">
                    {activeMedia.mediaKind === "image" ? <img src={activeMedia.previewSrc} alt={activeMedia.name} className="max-h-[70vh] w-auto max-w-full rounded-md object-contain" /> : <div className="flex h-[60vh] w-full max-w-3xl items-center justify-center rounded-md bg-slate-900 text-white"><div className="flex items-center gap-2 text-lg"><Play size={18} />Video Preview</div></div>}
                  </div>
                  <button type="button" className="btn btn-ghost h-full rounded-none" onClick={() => setActiveMediaIndex((prev) => (prev === null ? null : (prev + 1) % mediaArtifacts.length))}><ChevronRight size={22} /></button>
                </div>
                <div className="border-t border-base-300 px-4 py-3"><div className="text-sm font-semibold">{activeMedia.name}</div><div className="text-xs text-base-content/70">{activeMedia.source_path}</div></div>
              </div>
            </div>
          ) : null}

          <div className="min-h-0 flex-1">
            {showMediaPreview ? (
              <Group orientation="vertical">
                <Panel defaultSize={36} minSize={36} maxSize={36}>
                  <div className="h-full overflow-auto rounded-lg border border-base-300 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <Image size={16} />
                      <h3 className="text-sm font-semibold">Media Preview</h3>
                      <span className="badge badge-sm">{mediaArtifacts.length}</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {mediaArtifacts.map((artifact) => (
                        <article
                          key={`media-${artifact.id}-${artifact.name}`}
                          className="cursor-pointer overflow-hidden rounded-lg border border-base-300 bg-base-100 transition hover:border-primary/60"
                          onClick={() => {
                            const index = mediaArtifacts.findIndex(
                              (item) => item.id === artifact.id && item.inode === artifact.inode,
                            );
                            setActiveMediaIndex(index >= 0 ? index : 0);
                          }}
                        >
                          <div className="relative h-28 bg-base-200">
                            {artifact.mediaKind === "image" ? (
                              <img
                                src={artifact.previewSrc}
                                alt={artifact.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
                                <Play size={20} />
                              </div>
                            )}
                            <span className="badge badge-neutral badge-sm absolute right-2 top-2">
                              {artifact.mediaKind === "image" ? "Image" : "Video"}
                            </span>
                          </div>
                          <div className="p-2">
                            <p className="truncate text-xs font-medium">{artifact.name}</p>
                            <p className="truncate text-[11px] text-base-content/60">
                              {artifact.source_path}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </Panel>

                <Panel
                  defaultSize={64}
                  minSize={20}
                  onResize={(size) => setIsControlCompact(Number(size) > 70)}
                >
                  {isPreviewCategory ? (
                    <Group orientation="horizontal">
                      <Panel defaultSize={68} minSize={45}>
                        <div className="h-full overflow-auto rounded-lg border border-base-300">
                          <table className="table table-zebra table-pin-rows">
                            <thead>
                              <tr><th>ID</th><th>Artifact</th><th>Category</th><th>Status</th><th>Inode</th><th>Path</th></tr>
                            </thead>
                            <tbody>
                              {filteredArtifacts.map((artifact) => {
                                const artifactKey = `${artifact.id}-${artifact.inode}`;
                                return (
                                  <tr key={artifactKey} className={`cursor-pointer ${selectedArtifactKey === artifactKey ? "bg-primary/10" : ""}`} onClick={() => setSelectedArtifactKey(artifactKey)}>
                                    <td className="font-mono text-xs">{artifact.id}</td>
                                    <td className="font-medium">{artifact.name}</td>
                                    <td><span className="badge badge-outline">{artifact.category}</span></td>
                                    <td><span className="badge badge-info badge-outline">{artifact.status}</span></td>
                                    <td className="font-mono text-xs">{artifact.inode}</td>
                                    <td className="font-mono text-xs">{artifact.source_path}</td>
                                  </tr>
                                );
                              })}
                              {!isLoading && filteredArtifacts.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-base-content/60">No artifacts found for this filter.</td></tr> : null}
                            </tbody>
                          </table>
                        </div>
                      </Panel>

                      <ResizeHandle />

                      <Panel defaultSize={32} minSize={20}>
                        <aside className="flex h-full min-h-0 flex-col rounded-lg border border-base-300 bg-base-100">
                          <div className="border-b border-base-300 px-4 py-3">
                            <h3 className="text-sm font-semibold">Preview</h3>
                          </div>

                          <div className="space-y-3 overflow-auto p-4 text-sm">
                            {selectedArtifact ? (
                              selectedGenericDetails.map((item) => (
                                <div key={`media-preview-${item.label}`}>
                                  <div className="text-xs uppercase text-base-content/60">{item.label}</div>
                                  <div>{item.value}</div>
                                </div>
                              ))
                            ) : (
                              <div className="text-base-content/60">Select an artifact to preview.</div>
                            )}
                          </div>
                        </aside>
                      </Panel>
                    </Group>
                  ) : (
                    <div className="h-full overflow-auto rounded-lg border border-base-300">
                      <table className="table table-zebra table-pin-rows">
                        <thead>
                          <tr><th>ID</th><th>Artifact</th><th>Category</th><th>Status</th><th>Inode</th><th>Path</th></tr>
                        </thead>
                        <tbody>
                          {filteredArtifacts.map((artifact) => (
                            <tr key={`${artifact.id}-${artifact.name}`}>
                              <td className="font-mono text-xs">{artifact.id}</td>
                              <td className="font-medium">{artifact.name}</td>
                              <td><span className="badge badge-outline">{artifact.category}</span></td>
                              <td><span className="badge badge-info badge-outline">{artifact.status}</span></td>
                              <td className="font-mono text-xs">{artifact.inode}</td>
                              <td className="font-mono text-xs">{artifact.source_path}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              </Group>
            ) : isPreviewCategory ? (
              <Group orientation="horizontal">
                <Panel defaultSize={68} minSize={45}>
                  <div className="h-full overflow-auto rounded-lg border border-base-300">
                    <table className="table table-zebra table-pin-rows">
                          <thead>
                            <tr><th>ID</th><th>Artifact</th><th>Category</th><th>Status</th><th>Inode</th><th>Path</th></tr>
                          </thead>
                          <tbody>
                            {filteredArtifacts.map((artifact) => {
                              const artifactKey = `${artifact.id}-${artifact.inode}`;
                              return (
                                <tr key={artifactKey} className={`cursor-pointer ${selectedArtifactKey === artifactKey ? "bg-primary/10" : ""}`} onClick={() => setSelectedArtifactKey(artifactKey)}>
                                  <td className="font-mono text-xs">{artifact.id}</td>
                                  <td className="font-medium">{artifact.name}</td>
                                  <td><span className="badge badge-outline">{artifact.category}</span></td>
                                  <td><span className="badge badge-info badge-outline">{artifact.status}</span></td>
                                  <td className="font-mono text-xs">{artifact.inode}</td>
                                  <td className="font-mono text-xs">{artifact.source_path}</td>
                                </tr>
                              );
                            })}
                            {!isLoading && filteredArtifacts.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-base-content/60">No artifacts found for this filter.</td></tr> : null}
                          </tbody>
                        </table>
                      </div>
                    </Panel>

                    <ResizeHandle />

                    <Panel defaultSize={32} minSize={20}>
                      <aside className="flex h-full min-h-0 flex-col rounded-lg border border-base-300 bg-base-100">
                        <div className="border-b border-base-300 px-4 py-3">
                          <h3 className="text-sm font-semibold">Preview</h3>
                        </div>

                        {selectedCategory === "Contacts" ? (
                          <div className="space-y-3 overflow-auto p-4 text-sm">
                            {selectedContactDetails ? (
                              <>
                                <div><div className="text-xs uppercase text-base-content/60">Name</div><div className="font-medium">{selectedContactDetails.fullName}</div></div>
                                <div><div className="text-xs uppercase text-base-content/60">Primary</div><div>{selectedContactDetails.primaryNumber}</div></div>
                                {selectedContactDetails.secondaryNumber ? <div><div className="text-xs uppercase text-base-content/60">Secondary</div><div>{selectedContactDetails.secondaryNumber}</div></div> : null}
                                {selectedContactDetails.email ? <div><div className="text-xs uppercase text-base-content/60">Email</div><div>{selectedContactDetails.email}</div></div> : null}
                                {selectedContactDetails.account ? <div><div className="text-xs uppercase text-base-content/60">Account</div><div>{selectedContactDetails.account}</div></div> : null}
                                {selectedContactDetails.sourceApp ? <div><div className="text-xs uppercase text-base-content/60">Source App</div><div>{selectedContactDetails.sourceApp}</div></div> : null}
                              </>
                            ) : (
                              <div className="text-base-content/60">Select an artifact to preview.</div>
                            )}
                          </div>
                        ) : null}

                        {selectedCategory === "Messages" ? (
                          <div className="flex min-h-0 flex-1 flex-col">
                            <div className="border-b border-base-300 px-4 py-2 text-xs text-base-content/70">{selectedArtifact ? selectedArtifact.name : "No artifact selected"}</div>
                            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-base-200/30 p-3">
                              {selectedMessageThread.length > 0 ? (
                                selectedMessageThread.map((item) => (
                                  <div key={item.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${item.direction === "outgoing" ? "ml-auto bg-primary/20" : "bg-base-100"}`}>
                                    <div className="mb-1 text-[11px] text-base-content/60">{item.sender} - {item.timestamp}</div>
                                    <div>{item.body}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-base-content/60">Select an artifact to preview.</div>
                              )}
                            </div>
                          </div>
                        ) : null}

                        {!['Contacts', 'Messages'].includes(selectedCategory) ? (
                          <div className="space-y-3 overflow-auto p-4 text-sm">
                            {selectedArtifact ? (
                              selectedGenericDetails.map((item) => (
                                <div key={`${selectedCategory}-${item.label}`}>
                                  <div className="text-xs uppercase text-base-content/60">{item.label}</div>
                                  <div>{item.value}</div>
                                </div>
                              ))
                            ) : (
                              <div className="text-base-content/60">Select an artifact to preview.</div>
                            )}
                          </div>
                        ) : null}
                      </aside>
                    </Panel>
              </Group>
            ) : (
              <div className="h-full overflow-auto rounded-lg border border-base-300">
                <table className="table table-zebra table-pin-rows">
                  <thead>
                    <tr><th>ID</th><th>Artifact</th><th>Category</th><th>Status</th><th>Inode</th><th>Path</th></tr>
                  </thead>
                  <tbody>
                    {filteredArtifacts.map((artifact) => (
                      <tr key={`${artifact.id}-${artifact.name}`}>
                        <td className="font-mono text-xs">{artifact.id}</td>
                        <td className="font-medium">{artifact.name}</td>
                        <td><span className="badge badge-outline">{artifact.category}</span></td>
                        <td><span className="badge badge-info badge-outline">{artifact.status}</span></td>
                        <td className="font-mono text-xs">{artifact.inode}</td>
                        <td className="font-mono text-xs">{artifact.source_path}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ArtifactsPage;

