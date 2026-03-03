import { File } from "lucide-react";
import { useMemo } from "react";

type FileEntry = {
  name: string;
  path: string;
  parent_path: string;
  meta_addr: number;
};

type FileSystemTree = {
  id: string;
  label: string;
  offset: number;
  fs_type: string;
  folders: Array<unknown>;
  files: FileEntry[];
};

type DataSourceTree = {
  image_path: string;
  image_name: string;
  filesystems: FileSystemTree[];
};

type FileRow = {
  sourceName: string;
  sourceImagePath: string;
  filesystemId: string;
  filesystemLabel: string;
  fileName: string;
  filePath: string;
  parentPath: string;
};

type DirectorySelection = {
  sourceImagePath: string;
  filesystemId: string;
  path: string;
};

type Props = {
  dataSources: DataSourceTree[];
  selectedDirectory: DirectorySelection | null;
};

const ResultViewer = ({ dataSources, selectedDirectory }: Props) => {
  const rows = useMemo<FileRow[]>(() => {
    return dataSources.flatMap((source) =>
      source.filesystems.flatMap((filesystem) =>
        filesystem.files.map((file) => ({
          sourceName: source.image_name,
          sourceImagePath: source.image_path,
          filesystemId: filesystem.id,
          filesystemLabel: filesystem.fs_type
            ? `${filesystem.label} [${filesystem.fs_type}]`
            : filesystem.label,
          fileName: file.name,
          filePath: file.path,
          parentPath: file.parent_path,
        })),
      ),
    );
  }, [dataSources]);

  const filteredRows = useMemo(() => {
    if (!selectedDirectory) {
      return rows;
    }
    return rows.filter(
      (row) =>
        row.sourceImagePath === selectedDirectory.sourceImagePath &&
        row.filesystemId === selectedDirectory.filesystemId &&
        row.parentPath === selectedDirectory.path,
    );
  }, [rows, selectedDirectory]);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl bg-base-100 ring-1 ring-base-300 shadow-2xl">
      <div className="border-b border-base-300 bg-base-200/35 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <File size={16} />
            <h2 className="text-sm font-semibold tracking-wide text-base-content/90">
              Files
            </h2>
          </div>
          <span className="rounded-full border border-base-300 bg-base-100 px-2 py-0.5 text-xs font-medium text-base-content/70">
            {filteredRows.length} results
          </span>
        </div>
        {selectedDirectory && (
          <div className="mt-2 text-xs text-base-content/70">
            Directory:{" "}
            <span className="font-mono text-base-content/80">
              {selectedDirectory.path}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-base-100/95 backdrop-blur">
            <tr className="border-b border-base-300 text-left text-xs font-semibold tracking-wider text-base-content/70">
              <th className="px-4 py-2">FILE</th>
              <th className="px-4 py-2">PATH</th>
              <th className="px-4 py-2">FILESYSTEM</th>
              <th className="px-4 py-2">SOURCE</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, idx) => (
              <tr
                key={`${row.sourceName}-${row.filesystemLabel}-${row.filePath}-${idx}`}
                className="border-b border-base-300/70 transition hover:bg-base-200/40"
              >
                <td
                  className={`px-4 py-2 text-base-content ${idx % 2 === 0 ? "bg-base-100" : "bg-base-200/20"}`}
                >
                  <div className="flex items-center gap-2">
                    <File size={14} />
                    {row.fileName}
                  </div>
                </td>
                <td
                  className={`px-4 py-2 font-mono text-xs text-base-content/80 ${idx % 2 === 0 ? "bg-base-100" : "bg-base-200/20"}`}
                >
                  {row.filePath}
                </td>
                <td
                  className={`px-4 py-2 text-base-content/80 ${idx % 2 === 0 ? "bg-base-100" : "bg-base-200/20"}`}
                >
                  {row.filesystemLabel}
                </td>
                <td
                  className={`px-4 py-2 text-base-content/80 ${idx % 2 === 0 ? "bg-base-100" : "bg-base-200/20"}`}
                >
                  {row.sourceName}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ResultViewer;
