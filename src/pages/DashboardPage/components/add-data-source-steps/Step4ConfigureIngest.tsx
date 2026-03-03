import { useEffect, useState } from "react";
import type { DataSourceType } from "./Step2SelectDataSourceType";
import type { DataSourceConfig } from "./Step3SelectDataSource";

export type IngestConfig = {
  hashLookup: boolean;
  fileTypeIdentification: boolean;
  embeddedFileExtractor: boolean;
  exifParser: boolean;
  keywordSearch: boolean;
  recentActivity: boolean;
  emailParser: boolean;
  encryptionDetection: boolean;
};

const defaultIngestConfig: IngestConfig = {
  hashLookup: true,
  fileTypeIdentification: true,
  embeddedFileExtractor: true,
  exifParser: true,
  keywordSearch: false,
  recentActivity: false,
  emailParser: false,
  encryptionDetection: false,
};

type Module = {
  key: keyof IngestConfig;
  label: string;
  description: string;
};

const modules: Module[] = [
  { key: "hashLookup", label: "Hash Lookup", description: "Calculate MD5 / SHA-256 hashes and compare against known databases." },
  { key: "fileTypeIdentification", label: "File Type Identification", description: "Identify file types by content signatures, not just extensions." },
  { key: "embeddedFileExtractor", label: "Embedded File Extractor", description: "Extract files embedded in archives, documents, and other containers." },
  { key: "exifParser", label: "EXIF Parser", description: "Extract metadata from images and media files (GPS, camera model, etc.)." },
  { key: "keywordSearch", label: "Keyword Search", description: "Index and search file contents for user-defined keywords or patterns." },
  { key: "recentActivity", label: "Recent Activity", description: "Extract recently accessed files, browser history, and OS activity." },
  { key: "emailParser", label: "Email Parser", description: "Parse email archives (PST, MBOX) and extract message metadata and bodies." },
  { key: "encryptionDetection", label: "Encryption Detection", description: "Flag encrypted or password-protected files for manual review." },
];

type Props = {
  hostName?: string;
  dataSourceType?: DataSourceType;
  dataSourceConfig?: DataSourceConfig;
  onConfigChange?: (config: IngestConfig) => void;
};

const Step4ConfigureIngest = ({
  hostName,
  dataSourceType,
  dataSourceConfig,
  onConfigChange,
}: Props) => {
  const [config, setConfig] = useState<IngestConfig>(defaultIngestConfig);

  const allSelected = Object.values(config).every(Boolean);
  const noneSelected = Object.values(config).every((v) => !v);

  const toggle = (key: keyof IngestConfig, value: boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAll = () => {
    const next = Object.fromEntries(
      Object.keys(config).map((k) => [k, !allSelected]),
    ) as IngestConfig;
    setConfig(next);
  };

  useEffect(() => {
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  const selectedCount = Object.values(config).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Context banner */}
      {(hostName ?? dataSourceConfig?.path) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-box border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          {hostName && (
            <>
              <span className="text-base-content/60">Host:</span>
              <span className="font-mono font-medium text-primary">{hostName}</span>
            </>
          )}
          {dataSourceType && (
            <>
              <span className="text-base-content/40">·</span>
              <span className="capitalize text-base-content/60">{dataSourceType.replace(/-/g, " ")}</span>
            </>
          )}
          {dataSourceConfig?.path && (
            <>
              <span className="text-base-content/40">·</span>
              <span className="max-w-[240px] truncate font-mono text-xs text-base-content/60">{dataSourceConfig.path}</span>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-base-content/70">
          Choose which ingest modules to run on this data source.
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-base-content/60">{selectedCount} / {modules.length} enabled</span>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={toggleAll}
          >
            {allSelected ? "Deselect all" : noneSelected ? "Select all" : "Select all"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {modules.map((mod) => (
          <label
            key={mod.key}
            className={`flex cursor-pointer items-start gap-3 rounded-box border p-3 transition ${
              config[mod.key]
                ? "border-primary/30 bg-primary/5"
                : "border-base-300 bg-base-100 hover:bg-base-200/30"
            }`}
          >
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm mt-0.5 shrink-0"
              checked={config[mod.key]}
              onChange={(e) => toggle(mod.key, e.target.checked)}
            />
            <div>
              <span className="text-sm font-medium">{mod.label}</span>
              <p className="mt-0.5 text-xs text-base-content/60">{mod.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default Step4ConfigureIngest;

