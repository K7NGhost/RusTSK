import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { X } from "lucide-react";
import type { DataSourceType } from "./Step2SelectDataSourceType";

export type DataSourceConfig = {
  path: string;
  paths: string[];
  ignoreOrphanFiles: boolean;
  timezone: string;
  sectorSize: string;
  md5: string;
  sha1: string;
  sha256: string;
};

type Props = {
  dataSourceType: DataSourceType;
  hostName?: string;
  initialPaths?: string[];
  onConfigChange?: (config: DataSourceConfig) => void;
};

const normalizePaths = (values: string[]) =>
  Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)),
  );

const normalizePathsForType = (dataSourceType: DataSourceType, values: string[]) => {
  const normalized = normalizePaths(values);
  if (dataSourceType === "logical-files") return normalized;
  return normalized.slice(0, 1);
};

const Step3SelectDataSource = ({
  dataSourceType,
  hostName,
  initialPaths = [],
  onConfigChange,
}: Props) => {
  const [paths, setPaths] = useState<string[]>(
    normalizePathsForType(dataSourceType, initialPaths),
  );
  const [ignoreOrphanFiles, setIgnoreOrphanFiles] = useState(false);
  const [timezone, setTimezone] = useState("(GMT-5:00) America/New_York");
  const [sectorSize, setSectorSize] = useState("Auto Detect");
  const [md5, setMd5] = useState("");
  const [sha1, setSha1] = useState("");
  const [sha256, setSha256] = useState("");
  const path = paths[0] ?? "";
  const supportsMultiplePaths = dataSourceType === "logical-files";

  useEffect(() => {
    setPaths(normalizePathsForType(dataSourceType, initialPaths));
  }, [dataSourceType, hostName, initialPaths]);

  // Propagate state changes upward.
  useEffect(() => {
    onConfigChange?.({
      path,
      paths,
      ignoreOrphanFiles,
      timezone,
      sectorSize,
      md5,
      sha1,
      sha256,
    });
  }, [path, paths, ignoreOrphanFiles, timezone, sectorSize, md5, sha1, sha256, onConfigChange]);

  const appendPaths = (incoming: string[]) => {
    const normalizedIncoming = normalizePathsForType(dataSourceType, incoming);
    if (normalizedIncoming.length === 0) return;

    if (supportsMultiplePaths) {
      setPaths((current) => normalizePaths([...current, ...normalizedIncoming]));
      return;
    }

    setPaths([normalizedIncoming[normalizedIncoming.length - 1]]);
  };

  const removePath = (value: string) => {
    setPaths((current) => current.filter((entry) => entry !== value));
  };

  const handleBrowse = async () => {
    const allowMultiple = supportsMultiplePaths;
    const selected = (await open({
      multiple: allowMultiple,
      directory: dataSourceType === "logical-files",
      title:
        dataSourceType === "logical-files"
          ? "Select folder"
          : dataSourceType === "local-disk"
            ? "Select disk device"
            : "Select disk image or VM file",
      filters:
        dataSourceType === "disk-image-or-vm-file"
          ? [{ name: "Disk Images", extensions: ["dd", "e01", "aff", "vmdk", "vhd", "iso", "img"] }]
          : dataSourceType === "unallocated-space-image-file"
            ? [{ name: "Image Files", extensions: ["dd", "img", "bin"] }]
            : undefined,
    })) as string | string[] | null;

    if (typeof selected === "string") {
      appendPaths([selected]);
      return;
    }

    if (Array.isArray(selected)) {
      appendPaths(selected);
    }
  };

  const selectedPathsSection = (label: string) =>
    paths.length > 0 ? (
      <div className="mt-3 space-y-2 rounded-box border border-base-300 bg-base-200/20 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-base-content/60">{label}</p>
        <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
          {paths.map((selectedPath) => (
            <div
              key={selectedPath}
              className="flex items-center gap-2 rounded border border-base-300 bg-base-100 px-2 py-1"
            >
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{selectedPath}</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-circle"
                onClick={() => removePath(selectedPath)}
                title="Remove"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  if (dataSourceType !== "disk-image-or-vm-file") {
    return (
      <div className="space-y-3">
        {hostName && (
          <div className="flex items-center gap-2 rounded-box border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <span className="text-base-content/60">Host:</span>
            <span className="font-mono font-medium text-primary">{hostName}</span>
            <span className="text-base-content/40">.</span>
            <span className="capitalize text-base-content/60">{dataSourceType.replace(/-/g, " ")}</span>
          </div>
        )}
        <p className="text-sm text-base-content/70">
          Configure the <span className="font-semibold capitalize">{dataSourceType.replace(/-/g, " ")}</span>{" "}
          source path below.
        </p>
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text font-medium">{dataSourceType === "logical-files" ? "Folder:" : "Path:"}</span>
          </label>
          <div className="flex gap-2">
            <input
              className="input input-bordered w-full"
              placeholder={dataSourceType === "local-disk" ? "\\\\.\\PhysicalDrive0" : "Select path..."}
              value={path}
              onChange={(event) =>
                setPaths(event.target.value.trim().length > 0 ? [event.target.value] : [])
              }
            />
            <button className="btn btn-outline" type="button" onClick={handleBrowse}>
              Browse
            </button>
          </div>
          {selectedPathsSection(dataSourceType === "logical-files" ? "Selected Paths" : "Selected Files")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hostName && (
        <div className="flex items-center gap-2 rounded-box border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span className="text-base-content/60">Host:</span>
          <span className="font-mono font-medium text-primary">{hostName}</span>
          <span className="text-base-content/40">.</span>
          <span className="text-base-content/60">Disk Image / VM File</span>
        </div>
      )}
      <div className="form-control">
        <label className="label py-1">
          <span className="label-text font-medium">Path:</span>
        </label>
        <div className="flex gap-2">
          <input
            className="input input-bordered w-full"
            value={path}
            onChange={(event) =>
              setPaths(event.target.value.trim().length > 0 ? [event.target.value] : [])
            }
          />
          <button className="btn btn-outline" type="button" onClick={handleBrowse}>
            Browse
          </button>
        </div>
        {selectedPathsSection("Selected Files")}
      </div>

      <label className="label cursor-pointer justify-start gap-3">
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={ignoreOrphanFiles}
          onChange={(event) => setIgnoreOrphanFiles(event.target.checked)}
        />
        <span className="label-text">Ignore orphan files in FAT file systems</span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="form-control w-full sm:col-span-2">
          <span className="label-text mb-1 font-medium">Time zone:</span>
          <select
            className="select select-bordered w-full"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
          >
            <option>(GMT-5:00) America/New_York</option>
            <option>(GMT+0:00) UTC</option>
            <option>(GMT+1:00) Europe/Berlin</option>
            <option>(GMT+5:30) Asia/Kolkata</option>
            <option>(GMT+9:00) Asia/Tokyo</option>
          </select>
        </label>

        <label className="form-control w-full sm:col-span-2">
          <span className="label-text mb-1 font-medium">Sector size:</span>
          <select
            className="select select-bordered w-full"
            value={sectorSize}
            onChange={(event) => setSectorSize(event.target.value)}
          >
            <option>Auto Detect</option>
            <option>512</option>
            <option>1024</option>
            <option>2048</option>
            <option>4096</option>
          </select>
        </label>
      </div>

      <div className="space-y-3 rounded-box border border-base-300 bg-base-200/20 p-4">
        <p className="text-sm font-medium">Hash Values (optional):</p>

        <label className="form-control w-full">
          <span className="label-text mb-1">MD5:</span>
          <input
            className="input input-bordered w-full"
            value={md5}
            onChange={(event) => setMd5(event.target.value)}
          />
        </label>

        <label className="form-control w-full">
          <span className="label-text mb-1">SHA-1:</span>
          <input
            className="input input-bordered w-full"
            value={sha1}
            onChange={(event) => setSha1(event.target.value)}
          />
        </label>

        <label className="form-control w-full">
          <span className="label-text mb-1">SHA-256:</span>
          <input
            className="input input-bordered w-full"
            value={sha256}
            onChange={(event) => setSha256(event.target.value)}
          />
        </label>

        <p className="text-xs text-base-content/70">
          NOTE: These values will not be validated when the data source is added.
        </p>
      </div>
    </div>
  );
};

export default Step3SelectDataSource;
