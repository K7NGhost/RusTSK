export type DataSourceType =
  | "disk-image-or-vm-file"
  | "local-disk"
  | "logical-files"
  | "unallocated-space-image-file";

const options: Array<{ id: DataSourceType; label: string }> = [
  { id: "disk-image-or-vm-file", label: "disk image or vm file" },
  { id: "local-disk", label: "local disk" },
  { id: "logical-files", label: "logical files" },
  { id: "unallocated-space-image-file", label: "unallocated space image file" },
];

type Props = {
  selectedType: DataSourceType;
  onChange: (value: DataSourceType) => void;
};

const Step2SelectDataSourceType = ({ selectedType, onChange }: Props) => {

  return (
    <div className="space-y-4">
      <p className="text-sm text-base-content/70">
        Select the data source type for this host.
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
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="data-source-type"
                className="radio radio-primary radio-sm"
                checked={selectedType === option.id}
                onChange={() => onChange(option.id)}
              />
              <span className="text-sm font-medium capitalize">{option.label}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default Step2SelectDataSourceType;
