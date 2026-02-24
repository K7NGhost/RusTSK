import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import type { DataSourceType } from "./Step2SelectDataSourceType";

type Props = {
  dataSourceType: DataSourceType;
};

const Step3SelectDataSource = ({ dataSourceType }: Props) => {
  const [path, setPath] = useState("E:\\");
  const [ignoreOrphanFiles, setIgnoreOrphanFiles] = useState(false);
  const [timezone, setTimezone] = useState("(GMT-5:00) America/New_York");
  const [sectorSize, setSectorSize] = useState("Auto Detect");
  const [md5, setMd5] = useState("");
  const [sha1, setSha1] = useState("");
  const [sha256, setSha256] = useState("");

  const handleBrowse = async () => {
    const selected = await open({
      multiple: false,
      directory: false,
      title: "Select disk image or VM file",
    });

    if (typeof selected === "string") {
      setPath(selected);
    }
  };

  if (dataSourceType !== "disk-image-or-vm-file") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-base-content/70">
          Step 3 options for <span className="font-semibold">{dataSourceType.replace(/-/g, " ")}</span> will be configured here.
        </p>
        <div className="rounded-box border border-base-300 bg-base-200/30 p-4 text-sm text-base-content/70">
          Select "disk image or vm file" in Step 2 to see image-file properties.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="form-control">
        <label className="label py-1">
          <span className="label-text font-medium">Path:</span>
        </label>
        <div className="flex gap-2">
          <input
            className="input input-bordered w-full"
            value={path}
            onChange={(event) => setPath(event.target.value)}
          />
          <button className="btn btn-outline" type="button" onClick={handleBrowse}>
            Browse
          </button>
        </div>
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
