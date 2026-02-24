import { useMemo, useState } from "react";

type HostMode = "generate" | "specify" | "existing";

type Props = {
  dataSourceName?: string;
};

const existingHosts = [
  "investigation-host-01",
  "forensic-workstation",
  "mobile-analysis-node",
  "evidence-ingest-server",
];

const normalizeHostName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "new-host";

const Step1SelectHost = ({ dataSourceName = "data-source.dd" }: Props) => {
  const [hostMode, setHostMode] = useState<HostMode>("generate");
  const [specifiedHostName, setSpecifiedHostName] = useState("");
  const [existingHost, setExistingHost] = useState(existingHosts[0]);

  const generatedHostName = useMemo(
    () => normalizeHostName(dataSourceName.replace(/\.[^/.]+$/, "")),
    [dataSourceName],
  );

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
            onChange={() => setHostMode("generate")}
          />
          <span className="label-text">Generate new host name based on data source name</span>
        </label>

        {hostMode === "generate" && (
          <div className="rounded-box border border-base-300 bg-base-200/30 p-3 text-sm">
            <div className="font-medium">Generated host name</div>
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
          <span className="label-text">Use existing host</span>
        </label>

        {hostMode === "existing" && (
          <select
            className="select select-bordered w-full"
            value={existingHost}
            onChange={(event) => setExistingHost(event.target.value)}
          >
            {existingHosts.map((host) => (
              <option key={host} value={host}>
                {host}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default Step1SelectHost;
