import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import TopToolbar from "../DashboardPage/components/TopToolbar";

type ArtifactKind = "Directory" | "Document" | "Image" | "Archive" | "Binary";

type ArtifactRecord = {
  id: string;
  name: string;
  kind: ArtifactKind;
  source_path: string;
  status: string;
  inode: number;
};

const artifactKindOptions: Array<ArtifactKind | "All Types"> = [
  "All Types",
  "Directory",
  "Document",
  "Image",
  "Archive",
  "Binary",
];

const ArtifactsPage = () => {
  const [query, setQuery] = useState("");
  const [selectedKind, setSelectedKind] =
    useState<ArtifactKind | "All Types">("All Types");
  const [imagePath, setImagePath] = useState(
    localStorage.getItem("cultivator-active-image-path") ?? "",
  );
  const [directoryPath, setDirectoryPath] = useState("/");
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<ArtifactRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadArtifacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredArtifacts = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return rows.filter((item) => {
      const matchesQuery =
        normalized.length === 0 ||
        item.name.toLowerCase().includes(normalized) ||
        item.id.toLowerCase().includes(normalized) ||
        String(item.inode).includes(normalized);
      const matchesType = selectedKind === "All Types" || item.kind === selectedKind;
      return matchesQuery && matchesType;
    });
  }, [query, rows, selectedKind]);

  return (
    <div className="flex h-screen flex-col bg-base-200/40">
      <TopToolbar />

      <main className="min-h-0 flex-1 p-4">
        <section className="h-full rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-base-content">Artifacts</h2>
            <span className="badge badge-neutral">{filteredArtifacts.length} shown</span>

            <label className="ml-auto flex items-center gap-2 rounded-md border border-base-300 bg-base-100 px-3 py-2 text-base-content/60">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-52 border-none bg-transparent text-sm text-base-content outline-none"
                placeholder="Search ID, name, inode..."
              />
            </label>

            <select
              className="select select-bordered select-sm"
              value={selectedKind}
              onChange={(event) =>
                setSelectedKind(event.target.value as ArtifactKind | "All Types")
              }
            >
              {artifactKindOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 grid gap-3 rounded-lg border border-base-300 p-3 md:grid-cols-[1fr_160px_220px_auto]">
            <input
              className="input input-bordered input-sm w-full"
              value={imagePath}
              onChange={(event) => {
                const next = event.target.value;
                setImagePath(next);
                localStorage.setItem("cultivator-active-image-path", next);
              }}
              placeholder="Disk image path (e.g. C:\\evidence\\disk.E01)"
            />
            <input
              className="input input-bordered input-sm w-full"
              value={offset}
              onChange={(event) => setOffset(Number(event.target.value || 0))}
              type="number"
              min={0}
              placeholder="Offset"
            />
            <input
              className="input input-bordered input-sm w-full"
              value={directoryPath}
              onChange={(event) => setDirectoryPath(event.target.value)}
              placeholder="Filesystem path (e.g. /)"
            />
            <div className="flex gap-2">
              <button
                className="btn btn-outline btn-sm"
                type="button"
                onClick={async () => {
                  const selected = await open({
                    multiple: false,
                    directory: false,
                    title: "Select disk image",
                  });
                  if (typeof selected === "string") {
                    setImagePath(selected);
                    localStorage.setItem("cultivator-active-image-path", selected);
                  }
                }}
              >
                Browse
              </button>
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={() => void loadArtifacts()}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Reload"}
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="alert alert-error mb-4 py-2 text-sm">{errorMessage}</div>
          ) : null}

          <div className="h-[calc(100%-10rem)] overflow-auto rounded-lg border border-base-300">
            <table className="table table-zebra table-pin-rows">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Artifact</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Inode</th>
                  <th>Path</th>
                </tr>
              </thead>
              <tbody>
                {filteredArtifacts.map((artifact) => (
                  <tr key={`${artifact.id}-${artifact.name}`}>
                    <td className="font-mono text-xs">{artifact.id}</td>
                    <td className="font-medium">{artifact.name}</td>
                    <td>{artifact.kind}</td>
                    <td>
                      <span className="badge badge-info badge-outline">
                        {artifact.status}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{artifact.inode}</td>
                    <td className="font-mono text-xs">{artifact.source_path}</td>
                  </tr>
                ))}
                {!isLoading && filteredArtifacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-base-content/60">
                      No artifacts found for this path.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ArtifactsPage;
