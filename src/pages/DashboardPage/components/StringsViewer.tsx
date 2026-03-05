import { AutoSizer } from "react-virtualized-auto-sizer";
import { List, type RowComponentProps } from "react-window";

export type StringEntry = {
  offset: number;
  value: string;
};

type Props = {
  hasFile: boolean;
  strings: StringEntry[];
  isLoading: boolean;
  error: string | null;
  scannedBytes: number;
  truncated: boolean;
  minLength: number;
  onMinLengthChange: (value: number) => void;
};

const formatOffset = (offset: number) =>
  `0x${offset.toString(16).padStart(8, "0").toUpperCase()}`;

const StringsViewer = ({
  hasFile,
  strings,
  isLoading,
  error,
  scannedBytes,
  truncated,
  minLength,
  onMinLengthChange,
}: Props) => {
  if (!hasFile) {
    return (
      <div className="grid h-full place-items-center rounded-lg border border-base-300 bg-base-200/30 text-sm text-base-content/70">
        Select a file to view extracted strings.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="collapse collapse-arrow shrink-0 rounded-lg border border-base-300 bg-base-200/20">
        <input type="checkbox" defaultChecked />
        <div className="collapse-title py-2 text-sm font-semibold text-base-content/90">
          Strings Viewer Settings
        </div>
        <div className="collapse-content max-h-40 space-y-3 overflow-auto overscroll-contain">
          <label className="form-control max-w-56">
            <span className="label-text text-xs">
              Minimum printable length (`strings -n`)
            </span>
            <input
              type="number"
              className="input input-bordered input-sm"
              min={2}
              max={64}
              value={minLength}
              onChange={(event) => onMinLengthChange(Number(event.target.value))}
            />
          </label>
          <div className="text-xs text-base-content/70">
            {strings.length} strings, scanned{" "}
            <span className="font-mono">{scannedBytes.toLocaleString()}</span>{" "}
            bytes
            {truncated ? " (truncated)" : ""}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-base-300 bg-base-100">
        {isLoading && (
          <div className="grid h-full place-items-center text-sm text-base-content/70">
            Extracting strings...
          </div>
        )}

        {!isLoading && error && (
          <div className="grid h-full place-items-center px-4 text-center text-sm text-error">
            Failed to extract strings: {error}
          </div>
        )}

        {!isLoading && !error && strings.length === 0 && (
          <div className="grid h-full place-items-center text-sm text-base-content/70">
            No printable strings found with minimum length {minLength}.
          </div>
        )}

        {!isLoading && !error && strings.length > 0 && (
          <AutoSizer
            renderProp={({ height, width }) => {
              const safeHeight = height ?? 0;
              const safeWidth = width ?? 0;
              if (safeHeight <= 0 || safeWidth <= 0) {
                return null;
              }

              const Row = ({
                index,
                style,
                items,
              }: RowComponentProps<{ items: StringEntry[] }>) => {
                const entry = items[index];
                return (
                  <div
                    style={style}
                    className="grid grid-cols-[11rem_1fr] items-center gap-2 border-b border-base-300/40 px-3 text-xs"
                  >
                    <span className="font-mono text-base-content/70">
                      {formatOffset(entry.offset)}
                    </span>
                    <span className="truncate font-mono text-base-content/90">
                      {entry.value}
                    </span>
                  </div>
                );
              };

              return (
                <List
                  style={{ height: safeHeight, width: safeWidth }}
                  rowCount={strings.length}
                  rowHeight={24}
                  rowComponent={Row}
                  rowProps={{ items: strings }}
                  overscanCount={20}
                />
              );
            }}
          />
        )}
      </div>
    </div>
  );
};

export default StringsViewer;
