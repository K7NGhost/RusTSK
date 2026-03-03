import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import type { DataSourceEntry } from "../../../../hooks/useDataSources";

type HostMode = "generate" | "specify" | "existing";

type Props = {
  dataSources?: DataSourceEntry[];
  onHostNameChange?: (name: string) => void;
  onDeleteDataSource?: (dataSourceId: string) => void;
};

const normalizeHostName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "new-host";

const randomSuffix = () =>
  Math.random().toString(36).slice(2, 9);

const Step1SelectHost = ({
  dataSources = [],
  onHostNameChange,
  onDeleteDataSource,
}: Props) => {
  const [hostMode, setHostMode] = useState<HostMode>("generate");
  const [specifiedHostName, setSpecifiedHostName] = useState("");
  const [existingDataSource, setExistingDataSource] = useState<string>("");
  const [suffix, setSuffix] = useState(randomSuffix);

  const regenerate = useCallback(() => setSuffix(randomSuffix()), []);

  const generatedHostName = useMemo(
    () => `data_source-${suffix}`,
    [suffix],
  );

  // Keep existing selection in sync when the data source list changes.
  useEffect(() => {
    if (dataSources.length === 0) {
      setExistingDataSource("");
      return;
    }
    if (!dataSources.find((entry) => entry.name === existingDataSource)) {
      setExistingDataSource(dataSources[0].name);
    }
  }, [dataSources, existingDataSource]);

  // Propagate the effective host name whenever it changes.
  useEffect(() => {
    if (!onHostNameChange) return;
    if (hostMode === "generate") onHostNameChange(generatedHostName);
    else if (hostMode === "specify")
      onHostNameChange(normalizeHostName(specifiedHostName) || generatedHostName);
    else if (hostMode === "existing")
      onHostNameChange(
        dataSources.some((entry) => entry.name === existingDataSource)
          ? existingDataSource
          : "",
      );
  }, [
    hostMode,
    generatedHostName,
    specifiedHostName,
    existingDataSource,
    dataSources,
    onHostNameChange,
  ]);

  const selectedExistingDataSource = dataSources.find(
    (entry) => entry.name === existingDataSource,
  );

  const handleDeleteSelectedDataSource = () => {
    if (!selectedExistingDataSource || !onDeleteDataSource) return;
    const confirmed = window.confirm(
      `Delete data source "${selectedExistingDataSource.name}"? This cannot be undone.`,
    );
    if (!confirmed) return;
    onDeleteDataSource(selectedExistingDataSource.id);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-base-content/70">
        Choose how this data source will be associated with a host.
      </p>

      <div className="space-y-3 rounded-box border border-base-300 bg-base-100 p-4">
        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="radio"
            name="host-mode"
            className="radio radio-primary"
            checked={hostMode === "generate"}
            onChange={() => {
              setHostMode("generate");
              regenerate();
            }}
          />
          <span className="label-text">Generate new host name based on data source name</span>
        </label>

        {hostMode === "generate" && (
          <div className="rounded-box border border-base-300 bg-base-200/30 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">Generated host name</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs gap-1"
                onClick={regenerate}
                title="Generate a new name"
              >
                <RefreshCw size={12} />
                Regenerate
              </button>
            </div>
            <div className="mt-1 font-mono text-base-content/80">{generatedHostName}</div>
          </div>
        )}

        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="radio"
            name="host-mode"
            className="radio radio-primary"
            checked={hostMode === "specify"}
            onChange={() => setHostMode("specify")}
          />
          <span className="label-text">Specify new host name</span>
        </label>

        {hostMode === "specify" && (
          <input
            className="input input-bordered w-full"
            placeholder="Enter host name"
            value={specifiedHostName}
            onChange={(event) => setSpecifiedHostName(event.target.value)}
          />
        )}

        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="radio"
            name="host-mode"
            className="radio radio-primary"
            checked={hostMode === "existing"}
            onChange={() => setHostMode("existing")}
          />
          <span className="label-text">Use existing data source</span>
        </label>

        {hostMode === "existing" && (
          <>
            {dataSources.length === 0 ? (
              <div className="rounded-box border border-base-300 bg-base-200/30 p-3 text-sm text-base-content/60">
                No data sources found. Add a data source first to create one.
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  className="select select-bordered w-full"
                  value={existingDataSource}
                  onChange={(event) => setExistingDataSource(event.target.value)}
                >
                  {dataSources.map((entry) => (
                    <option key={entry.id} value={entry.name}>
                      {entry.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-outline btn-error btn-sm"
                  onClick={handleDeleteSelectedDataSource}
                  disabled={!selectedExistingDataSource}
                  title="Delete selected data source"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Step1SelectHost;
