import { ChevronLeft, ChevronRight, File, Folder } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  DataSourceTree,
  DirectorySelection,
  FolderNode,
  SelectedFile,
} from "../../../features/case-service/dataSourceTypes";

type FileRow = {
  itemType: "file" | "folder";
  sourceName: string;
  sourceImagePath: string;
  filesystemId: string;
  filesystemOffset: number;
  filesystemLabel: string;
  fileName: string;
  filePath: string;
  parentPath: string;
};

type Props = {
  dataSources: DataSourceTree[];
  selectedDirectory: DirectorySelection | null;
  selectedFile: SelectedFile | null;
  onFileSelected: (file: SelectedFile) => void;
  onDirectorySelected: (selection: DirectorySelection) => void;
};

const sameDirectory = (
  a: DirectorySelection | null,
  b: DirectorySelection | null,
): boolean =>
  Boolean(
    a &&
      b &&
      a.sourceImagePath === b.sourceImagePath &&
      a.filesystemId === b.filesystemId &&
      a.path === b.path,
  );

const flattenFolderRows = (
  nodes: FolderNode[],
  parentPath: string,
  shared: {
    sourceName: string;
    sourceImagePath: string;
    filesystemId: string;
    filesystemOffset: number;
    filesystemLabel: string;
  },
): FileRow[] => {
  const rows: FileRow[] = [];
  for (const node of nodes) {
    rows.push({
      itemType: "folder",
      ...shared,
      fileName: node.name,
      filePath: node.path,
      parentPath,
    });
    rows.push(...flattenFolderRows(node.children, node.path, shared));
  }
  return rows;
};

const ResultViewer = ({
  dataSources,
  selectedDirectory,
  selectedFile,
  onFileSelected,
  onDirectorySelected,
}: Props) => {
  const [directoryHistory, setDirectoryHistory] = useState<DirectorySelection[]>(
    [],
  );
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (!selectedDirectory) {
      setDirectoryHistory([]);
      setHistoryIndex(-1);
      return;
    }

    setDirectoryHistory((prevHistory) => {
      if (historyIndex >= 0 && sameDirectory(prevHistory[historyIndex], selectedDirectory)) {
        return prevHistory;
      }

      if (
        historyIndex >= 0 &&
        historyIndex + 1 < prevHistory.length &&
        sameDirectory(prevHistory[historyIndex + 1], selectedDirectory)
      ) {
        setHistoryIndex(historyIndex + 1);
        return prevHistory;
      }

      if (
        historyIndex > 0 &&
        sameDirectory(prevHistory[historyIndex - 1], selectedDirectory)
      ) {
        setHistoryIndex(historyIndex - 1);
        return prevHistory;
      }

      const nextHistory = [
        ...prevHistory.slice(0, Math.max(historyIndex + 1, 0)),
        selectedDirectory,
      ];
      setHistoryIndex(nextHistory.length - 1);
      return nextHistory;
    });
  }, [historyIndex, selectedDirectory]);

  const rows = useMemo<FileRow[]>(() => {
    return dataSources.flatMap((source) =>
      source.filesystems.flatMap((filesystem) =>
        (() => {
          const shared = {
            sourceName: source.image_name,
            sourceImagePath: source.image_path,
            filesystemId: filesystem.id,
            filesystemOffset: filesystem.offset,
            filesystemLabel: filesystem.fs_type
              ? `${filesystem.label} [${filesystem.fs_type}]`
              : filesystem.label,
          };

          const folderRows = flattenFolderRows(filesystem.folders, "/", shared);
          const fileRows = filesystem.files.map((file) => ({
            itemType: "file" as const,
            ...shared,
            fileName: file.name,
            filePath: file.path,
            parentPath: file.parent_path,
          }));

          return [...folderRows, ...fileRows];
        })(),
      ),
    );
  }, [dataSources]);

  const filteredRows = useMemo(() => {
    if (!selectedDirectory) {
      return rows;
    }
    const inDirectory = rows.filter(
      (row) =>
        row.sourceImagePath === selectedDirectory.sourceImagePath &&
        row.filesystemId === selectedDirectory.filesystemId &&
        row.parentPath === selectedDirectory.path,
    );
    const folders = inDirectory.filter((row) => row.itemType === "folder");
    const files = inDirectory.filter((row) => row.itemType === "file");
    return [...folders, ...files];
  }, [rows, selectedDirectory]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex >= 0 && historyIndex < directoryHistory.length - 1;

  const goBack = () => {
    if (!canGoBack) {
      return;
    }
    const targetIndex = historyIndex - 1;
    const target = directoryHistory[targetIndex];
    if (!target) {
      return;
    }
    setHistoryIndex(targetIndex);
    onDirectorySelected(target);
  };

  const goForward = () => {
    if (!canGoForward) {
      return;
    }
    const targetIndex = historyIndex + 1;
    const target = directoryHistory[targetIndex];
    if (!target) {
      return;
    }
    setHistoryIndex(targetIndex);
    onDirectorySelected(target);
  };

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
          <div className="mt-2 flex items-center gap-2 text-xs text-base-content/70">
            <button
              className="btn btn-ghost btn-xs"
              disabled={!canGoBack}
              onClick={goBack}
              title="Back"
            >
              <ChevronLeft size={14} />
              Back
            </button>
            <button
              className="btn btn-ghost btn-xs"
              disabled={!canGoForward}
              onClick={goForward}
              title="Forward"
            >
              <ChevronRight size={14} />
              Forward
            </button>
            <div>
              Directory:{" "}
              <span className="font-mono text-base-content/80">
                {selectedDirectory.path}
              </span>
            </div>
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
                key={`${row.itemType}-${row.sourceImagePath}-${row.filesystemId}-${row.filePath}-${idx}`}
                className={`${row.itemType === "file" ? "cursor-pointer hover:bg-base-200/40" : "cursor-default"} border-b border-base-300/70 transition ${
                  row.itemType === "file" &&
                  selectedFile?.sourceImagePath === row.sourceImagePath &&
                  selectedFile.filesystemId === row.filesystemId &&
                  selectedFile.filePath === row.filePath
                    ? "bg-primary/10"
                    : ""
                }`}
                onClick={() => {
                  if (row.itemType === "file") {
                    onFileSelected({
                      sourceImagePath: row.sourceImagePath,
                      filesystemId: row.filesystemId,
                      filesystemOffset: row.filesystemOffset,
                      fileName: row.fileName,
                      filePath: row.filePath,
                    });
                  }
                }}
                onDoubleClick={() => {
                  if (row.itemType !== "folder") {
                    return;
                  }

                  onDirectorySelected({
                    sourceImagePath: row.sourceImagePath,
                    filesystemId: row.filesystemId,
                    path: row.filePath,
                  });
                }}
              >
                <td
                  className={`px-4 py-2 text-base-content ${idx % 2 === 0 ? "bg-base-100" : "bg-base-200/20"}`}
                >
                  <div className="flex items-center gap-2">
                    {row.itemType === "folder" ? (
                      <Folder size={14} />
                    ) : (
                      <File size={14} />
                    )}
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
