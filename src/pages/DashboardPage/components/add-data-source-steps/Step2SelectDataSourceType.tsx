export type DataSourceType =
  | "disk-image-or-vm-file"
  | "local-disk"
  | "logical-files"
  | "unallocated-space-image-file";

const options: Array<{ id: DataSourceType; label: string; description: string }> = [
  {
    id: "disk-image-or-vm-file",
    label: "disk image or vm file",
    description: "E01, DD, AFF, VMDK, and similar forensic or VM disk images.",
  },
  {
    id: "local-disk",
    label: "local disk",
    description: "Directly image a physical drive attached to this machine.",
  },
  {
    id: "logical-files",
    label: "logical files",
    description: "Add individual files or folders without imaging a full disk.",
  },
  {
    id: "unallocated-space-image-file",
    label: "unallocated space image file",
    description: "Analyse carved unallocated space extracted from a disk.",
  },
];

type Props = {
  selectedType: DataSourceType;
  onChange: (value: DataSourceType) => void;
  hostName?: string;
};

const Step2SelectDataSourceType = ({ selectedType, onChange, hostName }: Props) => {

  return (
    <div className="space-y-4">
      {hostName && (
        <div className="flex items-center gap-2 rounded-box border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span className="text-base-content/60">Host:</span>
          <span className="font-mono font-medium text-primary">{hostName}</span>
        </div>
      )}
      <p className="text-sm text-base-content/70">
        Select the data source type for{" "}
        <span className="font-medium text-base-content">{hostName ?? "this host"}</span>.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={`cursor-pointer rounded-box border p-4 transition ${
              selectedType === option.id
                ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                : "border-base-300 bg-base-100 hover:bg-base-200/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="data-source-type"
                className="radio radio-primary radio-sm mt-0.5 shrink-0"
                checked={selectedType === option.id}
                onChange={() => onChange(option.id)}
              />
              <div>
                <span className="text-sm font-medium capitalize">{option.label}</span>
                <p className="mt-0.5 text-xs text-base-content/60">{option.description}</p>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default Step2SelectDataSourceType;
