import { CheckCircle } from "lucide-react";
import type { DataSourceType } from "./Step2SelectDataSourceType";
import type { DataSourceConfig } from "./Step3SelectDataSource";
import type { IngestConfig } from "./Step4ConfigureIngest";

type Props = {
  hostName?: string;
  dataSourceType?: DataSourceType;
  dataSourceConfig?: DataSourceConfig;
  ingestConfig?: IngestConfig;
};

const labelForType: Record<string, string> = {
  "disk-image-or-vm-file": "Disk Image / VM File",
  "local-disk": "Local Disk",
  "logical-files": "Logical Files",
  "unallocated-space-image-file": "Unallocated Space Image File",
};

const Row = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div className="flex items-start gap-2 py-1">
      <span className="w-32 shrink-0 text-xs text-base-content/60">{label}</span>
      <span className="min-w-0 break-all font-mono text-xs font-medium">{value}</span>
    </div>
  ) : null;

const Step5AddDataSource = ({
  hostName,
  dataSourceType,
  dataSourceConfig,
  ingestConfig,
}: Props) => {
  const enabledModules = ingestConfig
    ? Object.entries(ingestConfig)
        .filter(([, v]) => v)
        .map(([k]) =>
          k
            .replace(/([A-Z])/g, " $1")
            .trim()
            .replace(/^./, (c) => c.toUpperCase()),
        )
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-base-content/70">
        <CheckCircle size={15} className="text-success" />
        Review all settings below, then click{" "}
        <span className="font-semibold text-base-content">Add Data Source</span> to begin ingestion.
      </div>

      {/* Host & type */}
      <div className="rounded-box border border-base-300 bg-base-200/20 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">Host &amp; Type</p>
        <Row label="Host" value={hostName || "—"} />
        <Row label="Source type" value={dataSourceType ? labelForType[dataSourceType] : "—"} />
      </div>

      {/* Data source */}
      {dataSourceConfig && (
        <div className="rounded-box border border-base-300 bg-base-200/20 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">Data Source</p>
          <Row label="Path" value={dataSourceConfig.path || "(not set)"} />
          <Row label="Time zone" value={dataSourceConfig.timezone} />
          <Row label="Sector size" value={dataSourceConfig.sectorSize} />
          {dataSourceConfig.ignoreOrphanFiles && (
            <Row label="Options" value="Ignore orphan files in FAT" />
          )}
          {(dataSourceConfig.md5 || dataSourceConfig.sha1 || dataSourceConfig.sha256) && (
            <>
              {dataSourceConfig.md5 && <Row label="MD5" value={dataSourceConfig.md5} />}
              {dataSourceConfig.sha1 && <Row label="SHA-1" value={dataSourceConfig.sha1} />}
              {dataSourceConfig.sha256 && <Row label="SHA-256" value={dataSourceConfig.sha256} />}
            </>
          )}
        </div>
      )}

      {/* Ingest modules */}
      {ingestConfig && (
        <div className="rounded-box border border-base-300 bg-base-200/20 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
            Ingest Modules ({enabledModules.length} enabled)
          </p>
          {enabledModules.length === 0 ? (
            <p className="text-xs text-base-content/50">No ingest modules selected.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {enabledModules.map((m) => (
                <span key={m} className="badge badge-primary badge-outline badge-sm">{m}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Step5AddDataSource;

