import { invoke } from "@tauri-apps/api/core";
import { HexViewer } from "@imccc/hex-viewer-js/react";
import { converter, formatHex, parse } from "culori";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DataSourceTree,
  DirectorySelection,
  FolderNode,
  SelectedFile,
} from "../../../features/case-service/dataSourceTypes";
import StringsViewer, { type StringEntry } from "./StringsViewer";

const tabs = [
  "Hex",
  "Strings",
  "Application",
  "Indexed Text",
  "Message",
  "File Metadata",
  "Results",
  "Other Occurrences",
];

const MAX_HEX_BYTES = 1024 * 1024;
const MAX_STRINGS_SCAN_BYTES = 8 * 1024 * 1024;
const MAX_STRINGS_RESULTS = 50_000;
const MAX_FOLDER_PREVIEW_FOLDERS = 10_000;
const MAX_FOLDER_PREVIEW_FILES = 20_000;
const DEFAULT_FONT_PX = 14;
const DEFAULT_ADDRESS_GAP = 0.4;
const DEFAULT_HEX_GAP = 0.6;
const DEFAULT_SECTION_GAP = 1;
const DEFAULT_MIN_STRINGS_LENGTH = 4;

type HexTheme = {
  background: string;
  text: string;
  address: string;
  dim: string;
  selectionBg: string;
  selectionFg: string;
};

const toRgb = converter("rgb");

const normalizeColorToHex = (input: string, fallback: string): string => {
  const parsed = parse(input);
  if (!parsed) {
    return fallback;
  }
  const rgb = toRgb(parsed);
  return formatHex(rgb);
};

const applyAlphaToColorInput = (colorInput: string, alpha: number): string => {
  if (alpha >= 1) {
    return colorInput;
  }

  if (colorInput.startsWith("oklch(") && !colorInput.includes("/")) {
    const inner = colorInput.slice(6, -1).trim();
    return `oklch(${inner} / ${alpha})`;
  }

  if (colorInput.startsWith("rgb(")) {
    const inner = colorInput.slice(4, -1).trim();
    return `rgb(${inner} / ${alpha})`;
  }

  if (colorInput.startsWith("hsl(")) {
    const inner = colorInput.slice(4, -1).trim();
    return `hsl(${inner} / ${alpha})`;
  }

  return colorInput;
};

const readThemeVarColor = (
  cssVarNames: string[],
  fallback: string,
  alpha = 1,
): string => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const rootStyles = getComputedStyle(document.documentElement);
  for (const cssVarName of cssVarNames) {
    const raw = rootStyles.getPropertyValue(cssVarName).trim();
    if (!raw) {
      continue;
    }

    const baseInput =
      raw.startsWith("#") ||
      raw.startsWith("rgb") ||
      raw.startsWith("hsl") ||
      raw.startsWith("oklch(")
        ? raw
        : `oklch(${raw})`;

    const colorInput = applyAlphaToColorInput(baseInput, alpha);
    const resolved = normalizeColorToHex(colorInput, "");
    if (resolved) {
      return resolved;
    }
  }

  return fallback;
};

type Props = {
  selectedFile: SelectedFile | null;
  selectedFolder: DirectorySelection | null;
  selectedDirectory: DirectorySelection | null;
  dataSources: DataSourceTree[];
};

type StringsCommandResult = {
  strings: StringEntry[];
  scanned_bytes: number;
  truncated: boolean;
};

type MetadataRow = {
  label: string;
  value: string;
};

type IstatDirectBlock = {
  start: number;
  length: number;
};

type PathMetadataResult = {
  name: string;
  path: string;
  type_label: string;
  mime_type: string;
  size: number;
  file_name_allocation: string;
  metadata_allocation: string;
  modified: number | null;
  accessed: number | null;
  created: number | null;
  changed: number | null;
  md5: string;
  sha256: string;
  hash_lookup_results: string;
  internal_id: number;
  istat_inode: number;
  istat_allocated: boolean;
  istat_group: number | null;
  istat_generation_id: number | null;
  istat_uid: number;
  istat_gid: number;
  istat_mode: string;
  istat_size: number;
  istat_num_links: number;
  istat_accessed: number | null;
  istat_file_modified: number | null;
  istat_inode_modified: number | null;
  istat_direct_blocks: IstatDirectBlock[];
};

type FolderPreviewPayload = {
  text: string;
  bytes: Uint8Array;
};

const normalizePathPrefix = (path: string): string => {
  if (path === "/") {
    return "/";
  }
  return `${path.replace(/\/+$/, "")}/`;
};

const collectFolderPaths = (
  nodes: FolderNode[],
  acc: string[] = [],
): string[] => {
  for (const node of nodes) {
    acc.push(node.path);
    collectFolderPaths(node.children, acc);
  }
  return acc;
};

const findFolderByPath = (
  nodes: FolderNode[],
  targetPath: string,
): FolderNode | null => {
  for (const node of nodes) {
    if (node.path === targetPath) {
      return node;
    }
    const foundInChild = findFolderByPath(node.children, targetPath);
    if (foundInChild) {
      return foundInChild;
    }
  }
  return null;
};

const dirname = (path: string): string => {
  if (!path || path === "/") {
    return "/";
  }
  const trimmed = path.endsWith("/") ? path.slice(0, -1) : path;
  const index = trimmed.lastIndexOf("/");
  if (index <= 0) {
    return "/";
  }
  return trimmed.slice(0, index);
};

const formatTimestamp = (unixSeconds: number | null): string => {
  if (!unixSeconds || unixSeconds <= 0) {
    return "0000-00-00 00:00:00";
  }

  const date = new Date(unixSeconds * 1000);
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).formatToParts(date);

  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";

  const year = part("year");
  const month = part("month");
  const day = part("day");
  const hour = part("hour");
  const minute = part("minute");
  const second = part("second");
  const zone = part("timeZoneName");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}${zone ? ` ${zone}` : ""}`;
};

const formatTimestampWithParenZone = (unixSeconds: number | null): string => {
  if (!unixSeconds || unixSeconds <= 0) {
    return "0000-00-00 00:00:00";
  }

  const rendered = formatTimestamp(unixSeconds);
  const parts = rendered.split(" ");
  if (parts.length < 3) {
    return rendered;
  }
  const zone = parts.pop();
  if (!zone) {
    return rendered;
  }
  return `${parts.join(" ")} (${zone})`;
};

const buildFolderPreviewPayload = (
  dataSources: DataSourceTree[],
  selectedFolder: DirectorySelection,
): FolderPreviewPayload | null => {
  const source = dataSources.find(
    (item) => item.image_path === selectedFolder.sourceImagePath,
  );
  const filesystem = source?.filesystems.find(
    (item) => item.id === selectedFolder.filesystemId,
  );

  if (!source || !filesystem) {
    return null;
  }

  const folderPath = selectedFolder.path;
  const prefix = normalizePathPrefix(folderPath);
  const allFolderPaths = collectFolderPaths(filesystem.folders);
  const foldersInScope = allFolderPaths.filter((path) =>
    folderPath === "/" ? true : path === folderPath || path.startsWith(prefix),
  );
  const filesInScope = filesystem.files.filter((file) =>
    folderPath === "/" ? true : file.path.startsWith(prefix),
  );

  const previewFolders = foldersInScope.slice(0, MAX_FOLDER_PREVIEW_FOLDERS);
  const previewFiles = filesInScope.slice(0, MAX_FOLDER_PREVIEW_FILES);

  const lines: string[] = [
    "FOLDER PREVIEW",
    `Path: ${folderPath}`,
    `Source: ${source.image_name}`,
    `Filesystem: ${filesystem.label}${filesystem.fs_type ? ` [${filesystem.fs_type}]` : ""}`,
    `Folders within scope: ${foldersInScope.length}`,
    `Files within scope: ${filesInScope.length}`,
    "",
    "[Folders]",
  ];

  if (previewFolders.length === 0) {
    lines.push("(none)");
  } else {
    for (const path of previewFolders) {
      lines.push(path);
    }
    if (foldersInScope.length > previewFolders.length) {
      lines.push(`... ${foldersInScope.length - previewFolders.length} more folders`);
    }
  }

  lines.push("", "[Files]");

  if (previewFiles.length === 0) {
    lines.push("(none)");
  } else {
    for (const file of previewFiles) {
      lines.push(file.path);
    }
    if (filesInScope.length > previewFiles.length) {
      lines.push(`... ${filesInScope.length - previewFiles.length} more files`);
    }
  }

  const text = `${lines.join("\n")}\n`;
  const bytes = new TextEncoder().encode(text);

  return { text, bytes };
};

const extractStringsFromText = (
  text: string,
  minLength: number,
  maxStrings: number,
): StringsCommandResult => {
  const strings: StringEntry[] = [];
  let offset = 0;

  for (const line of text.split("\n")) {
    if (line.length >= minLength) {
      strings.push({ offset, value: line });
      if (strings.length >= maxStrings) {
        return {
          strings,
          scanned_bytes: new TextEncoder().encode(text).length,
          truncated: true,
        };
      }
    }
    offset += line.length + 1;
  }

  return {
    strings,
    scanned_bytes: new TextEncoder().encode(text).length,
    truncated: false,
  };
};

const ContentViewer = ({
  selectedFile,
  selectedFolder,
  selectedDirectory,
  dataSources,
}: Props) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [hexData, setHexData] = useState<Uint8Array | null>(null);
  const [isHexLoading, setIsHexLoading] = useState(false);
  const [hexError, setHexError] = useState<string | null>(null);
  const [stringsData, setStringsData] = useState<StringEntry[]>([]);
  const [isStringsLoading, setIsStringsLoading] = useState(false);
  const [stringsError, setStringsError] = useState<string | null>(null);
  const [stringsScannedBytes, setStringsScannedBytes] = useState(0);
  const [stringsTruncated, setStringsTruncated] = useState(false);
  const [minStringsLength, setMinStringsLength] = useState(
    DEFAULT_MIN_STRINGS_LENGTH,
  );
  const [themeVersion, setThemeVersion] = useState(0);
  const [fontPx, setFontPx] = useState(DEFAULT_FONT_PX);
  const [addressGapChars, setAddressGapChars] = useState(DEFAULT_ADDRESS_GAP);
  const [hexGapChars, setHexGapChars] = useState(DEFAULT_HEX_GAP);
  const [sectionGapChars, setSectionGapChars] = useState(DEFAULT_SECTION_GAP);
  const [pathMetadata, setPathMetadata] = useState<PathMetadataResult | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const stringsCacheRef = useRef<Map<string, StringsCommandResult>>(new Map());
  const folderPreview = useMemo(
    () =>
      selectedFolder ? buildFolderPreviewPayload(dataSources, selectedFolder) : null,
    [dataSources, selectedFolder],
  );
  const hasSelection = Boolean(selectedFile || selectedFolder);
  const metadataTarget = useMemo(() => {
    if (selectedFile) {
      return {
        imagePath: selectedFile.sourceImagePath,
        offset: selectedFile.filesystemOffset,
        path: selectedFile.filePath,
      };
    }

    const folderLikeSelection = selectedFolder ?? selectedDirectory;
    if (!folderLikeSelection) {
      return null;
    }

    const source = dataSources.find(
      (item) => item.image_path === folderLikeSelection.sourceImagePath,
    );
    const filesystem = source?.filesystems.find(
      (item) => item.id === folderLikeSelection.filesystemId,
    );
    if (!source || !filesystem) {
      return null;
    }

    return {
      imagePath: source.image_path,
      offset: filesystem.offset,
      path: folderLikeSelection.path,
    };
  }, [dataSources, selectedDirectory, selectedFile, selectedFolder]);
  const metadataView = useMemo(() => {
    const sourceImagePath =
      selectedFile?.sourceImagePath ??
      selectedFolder?.sourceImagePath ??
      selectedDirectory?.sourceImagePath;
    const filesystemId =
      selectedFile?.filesystemId ??
      selectedFolder?.filesystemId ??
      selectedDirectory?.filesystemId;

    if (!sourceImagePath || !filesystemId) {
      return null;
    }

    const source = dataSources.find((item) => item.image_path === sourceImagePath);
    const filesystem = source?.filesystems.find((item) => item.id === filesystemId);

    if (!source || !filesystem) {
      return {
        title: "Metadata",
        rows: [
          { label: "Source image path", value: sourceImagePath },
          { label: "Filesystem ID", value: filesystemId },
          { label: "Status", value: "Metadata could not be resolved." },
        ] as MetadataRow[],
      };
    }

    const filesystemLabel = filesystem.fs_type
      ? `${filesystem.label} [${filesystem.fs_type}]`
      : filesystem.label;

    if (selectedFile) {
      const fileEntry = filesystem.files.find(
        (entry) => entry.path === selectedFile.filePath,
      );
      const rows: MetadataRow[] = [
        { label: "Type", value: "File" },
        { label: "Name", value: selectedFile.fileName },
        { label: "Path", value: selectedFile.filePath },
        {
          label: "Parent Path",
          value: fileEntry?.parent_path ?? dirname(selectedFile.filePath),
        },
        {
          label: "Metadata Address",
          value:
            fileEntry?.meta_addr !== undefined
              ? `0x${fileEntry.meta_addr.toString(16).toUpperCase()} (${fileEntry.meta_addr})`
              : "N/A",
        },
        { label: "Filesystem", value: filesystemLabel },
        { label: "Filesystem ID", value: filesystem.id },
        {
          label: "Filesystem Offset",
          value: `0x${filesystem.offset.toString(16).toUpperCase()} (${filesystem.offset})`,
        },
        { label: "Source Image", value: source.image_name },
        { label: "Source Image Path", value: source.image_path },
      ];

      return { title: "File Metadata", rows };
    }

    const folderPath = selectedFolder?.path ?? selectedDirectory?.path;
    if (!folderPath) {
      return null;
    }

    const folderNode =
      folderPath === "/" ? null : findFolderByPath(filesystem.folders, folderPath);
    const immediateSubfolders =
      folderPath === "/" ? filesystem.folders.length : folderNode?.children.length ?? 0;
    const immediateFiles = filesystem.files.filter(
      (entry) => entry.parent_path === folderPath,
    ).length;
    const descendantSubfolders =
      folderPath === "/"
        ? collectFolderPaths(filesystem.folders).length
        : collectFolderPaths(folderNode?.children ?? []).length;
    const descendantFiles =
      folderPath === "/"
        ? filesystem.files.length
        : filesystem.files.filter((entry) =>
            entry.path.startsWith(normalizePathPrefix(folderPath)),
          ).length;

    const rows: MetadataRow[] = [
      { label: "Type", value: "Folder" },
      { label: "Name", value: folderPath === "/" ? "Root" : folderPath.split("/").pop() || folderPath },
      { label: "Path", value: folderPath },
      { label: "Parent Path", value: dirname(folderPath) },
      {
        label: "Metadata Address",
        value:
          folderPath === "/"
            ? "Root pseudo-node (no direct metadata address in current tree data)"
            : folderNode
              ? `0x${folderNode.meta_addr.toString(16).toUpperCase()} (${folderNode.meta_addr})`
              : "N/A",
      },
      { label: "Immediate Subfolders", value: String(immediateSubfolders) },
      { label: "Immediate Files", value: String(immediateFiles) },
      { label: "Descendant Subfolders", value: String(descendantSubfolders) },
      { label: "Descendant Files", value: String(descendantFiles) },
      { label: "Filesystem", value: filesystemLabel },
      { label: "Filesystem ID", value: filesystem.id },
      {
        label: "Filesystem Offset",
        value: `0x${filesystem.offset.toString(16).toUpperCase()} (${filesystem.offset})`,
      },
      { label: "Source Image", value: source.image_name },
      { label: "Source Image Path", value: source.image_path },
    ];

    return { title: "Folder Metadata", rows };
  }, [dataSources, selectedDirectory, selectedFile, selectedFolder]);

  useEffect(() => {
    const currentFile = selectedFile;

    if (!currentFile && !selectedFolder) {
      setHexData(null);
      setHexError(null);
      setIsHexLoading(false);
      return;
    }

    if (!currentFile && selectedFolder) {
      setIsHexLoading(false);
      if (!folderPreview) {
        setHexData(null);
        setHexError(
          `Unable to build folder preview for path: ${selectedFolder.path}`,
        );
        return;
      }
      setHexData(folderPreview.bytes);
      setHexError(null);
      return;
    }

    if (!currentFile) {
      return;
    }

    let cancelled = false;
    setIsHexLoading(true);
    setHexError(null);

    void invoke<number[]>("read_file_bytes", {
      imagePath: currentFile.sourceImagePath,
      offset: currentFile.filesystemOffset,
      path: currentFile.filePath,
      maxBytes: MAX_HEX_BYTES,
    })
      .then((bytes) => {
        if (cancelled) {
          return;
        }
        setHexData(new Uint8Array(bytes));
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setHexData(null);
        setHexError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) {
          setIsHexLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [folderPreview, selectedFile, selectedFolder]);

  useEffect(() => {
    const currentFile = selectedFile;

    if (!currentFile && !selectedFolder) {
      setStringsData([]);
      setStringsError(null);
      setIsStringsLoading(false);
      setStringsScannedBytes(0);
      setStringsTruncated(false);
      return;
    }

    if (!currentFile && selectedFolder) {
      setIsStringsLoading(false);
      if (!folderPreview) {
        setStringsData([]);
        setStringsScannedBytes(0);
        setStringsTruncated(false);
        setStringsError(
          `Unable to build folder preview for path: ${selectedFolder.path}`,
        );
        return;
      }

      const result = extractStringsFromText(
        folderPreview.text,
        minStringsLength,
        MAX_STRINGS_RESULTS,
      );
      setStringsData(result.strings);
      setStringsScannedBytes(result.scanned_bytes);
      setStringsTruncated(result.truncated);
      setStringsError(null);
      return;
    }

    if (!currentFile) {
      return;
    }

    const cacheKey = [
      currentFile.sourceImagePath,
      currentFile.filesystemOffset,
      currentFile.filePath,
      minStringsLength,
    ].join("|");

    const cached = stringsCacheRef.current.get(cacheKey);
    if (cached) {
      setStringsData(cached.strings);
      setStringsScannedBytes(cached.scanned_bytes);
      setStringsTruncated(cached.truncated);
      setStringsError(null);
      setIsStringsLoading(false);
      return;
    }

    let cancelled = false;
    setIsStringsLoading(true);
    setStringsError(null);

    void invoke<StringsCommandResult>("read_file_strings", {
      imagePath: currentFile.sourceImagePath,
      offset: currentFile.filesystemOffset,
      path: currentFile.filePath,
      minLength: minStringsLength,
      maxBytes: MAX_STRINGS_SCAN_BYTES,
      maxStrings: MAX_STRINGS_RESULTS,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }
        stringsCacheRef.current.set(cacheKey, result);
        setStringsData(result.strings);
        setStringsScannedBytes(result.scanned_bytes);
        setStringsTruncated(result.truncated);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setStringsData([]);
        setStringsScannedBytes(0);
        setStringsTruncated(false);
        setStringsError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) {
          setIsStringsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [folderPreview, minStringsLength, selectedFile, selectedFolder]);

  useEffect(() => {
    if (!metadataTarget) {
      setPathMetadata(null);
      setMetadataError(null);
      setIsMetadataLoading(false);
      return;
    }

    let cancelled = false;
    setIsMetadataLoading(true);
    setMetadataError(null);

    void invoke<PathMetadataResult>("read_path_metadata", {
      imagePath: metadataTarget.imagePath,
      offset: metadataTarget.offset,
      path: metadataTarget.path,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }
        setPathMetadata(result);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setPathMetadata(null);
        setMetadataError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) {
          setIsMetadataLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [metadataTarget]);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setThemeVersion((prev) => prev + 1);
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme", "class", "style"],
    });
    return () => observer.disconnect();
  }, []);

  const hexTheme = useMemo<HexTheme>(
    () => ({
      background: readThemeVarColor(["--color-base-100", "--b1"], "#1E1E1E"),
      text: readThemeVarColor(["--color-base-content", "--bc"], "#FFFFFF"),
      address: readThemeVarColor(
        ["--color-base-content", "--bc"],
        "#8EC0E4",
        0.75,
      ),
      dim: readThemeVarColor(["--color-base-content", "--bc"], "#888888", 0.55),
      selectionBg: readThemeVarColor(["--color-primary", "--p"], "#0078D4"),
      selectionFg: readThemeVarColor(
        ["--color-primary-content", "--pc"],
        "#FFFFFF",
      ),
    }),
    [themeVersion],
  );

  useEffect(() => {
    const activeTheme = document.documentElement.getAttribute("data-theme");
    console.log("[ContentViewer] Hex theme resolved", {
      activeTheme,
      themeVersion,
      hexTheme,
    });
  }, [hexTheme, themeVersion]);

  useEffect(() => {
    const activeTheme = document.documentElement.getAttribute("data-theme");
    const rootStyles = getComputedStyle(document.documentElement);
    const daisyThemeVars = {
      "--color-base-100": rootStyles.getPropertyValue("--color-base-100").trim(),
      "--color-base-content": rootStyles
        .getPropertyValue("--color-base-content")
        .trim(),
      "--color-primary": rootStyles.getPropertyValue("--color-primary").trim(),
      "--color-primary-content": rootStyles
        .getPropertyValue("--color-primary-content")
        .trim(),
      "--b1": rootStyles.getPropertyValue("--b1").trim(),
      "--bc": rootStyles.getPropertyValue("--bc").trim(),
      "--p": rootStyles.getPropertyValue("--p").trim(),
      "--pc": rootStyles.getPropertyValue("--pc").trim(),
    };

    console.log("[ContentViewer] Daisy theme vars", {
      activeTheme,
      themeVersion,
      ...daisyThemeVars,
    });
  }, [themeVersion]);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl bg-base-100 ring-1 ring-base-300 shadow-2xl">
      <div className="border-b border-base-300 px-2 pt-2">
        <div className="tabs tabs-sm tabs-box overflow-x-auto">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={`tab whitespace-nowrap ${selectedTab === index ? "tab-active" : ""}`}
              onClick={() => setSelectedTab(index)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-base-300/80 px-3 py-2 text-xs text-base-content/70">
        {selectedFile ? (
          <span>
            Selected file:{" "}
            <span className="font-mono text-base-content/90">
              {selectedFile.filePath}
            </span>
          </span>
        ) : selectedFolder ? (
          <span>
            Selected folder:{" "}
            <span className="font-mono text-base-content/90">
              {selectedFolder.path}
            </span>
          </span>
        ) : selectedDirectory ? (
          <span>
            Current directory:{" "}
            <span className="font-mono text-base-content/90">
              {selectedDirectory.path}
            </span>
          </span>
        ) : (
          <span>Select a file or folder from Results to preview content.</span>
        )}
      </div>

      <div className="min-h-0 flex-1 p-3">
        {selectedTab === 0 ? (
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
            <div className="shrink-0">
              <div className="collapse collapse-arrow rounded-lg border border-base-300 bg-base-200/20">
                <input type="checkbox" defaultChecked />
                <div className="collapse-title py-2 text-sm font-semibold text-base-content/90">
                  Hex Viewer Settings
                </div>
                <div className="collapse-content max-h-56 space-y-3 overflow-auto overscroll-contain">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="form-control">
                      <span className="label-text text-xs">Font Size</span>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        min={8}
                        max={48}
                        value={fontPx}
                        onChange={(event) => setFontPx(Number(event.target.value))}
                      />
                    </label>
                    <label className="form-control">
                      <span className="label-text text-xs">Address Gap</span>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        min={0}
                        max={4}
                        step={0.1}
                        value={addressGapChars}
                        onChange={(event) =>
                          setAddressGapChars(Number(event.target.value))
                        }
                      />
                    </label>
                    <label className="form-control">
                      <span className="label-text text-xs">Hex Gap</span>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        min={0}
                        max={4}
                        step={0.1}
                        value={hexGapChars}
                        onChange={(event) =>
                          setHexGapChars(Number(event.target.value))
                        }
                      />
                    </label>
                    <label className="form-control">
                      <span className="label-text text-xs">Section Gap</span>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        min={0}
                        max={8}
                        step={0.1}
                        value={sectionGapChars}
                        onChange={(event) =>
                          setSectionGapChars(Number(event.target.value))
                        }
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={() => {
                        setFontPx(DEFAULT_FONT_PX);
                        setAddressGapChars(DEFAULT_ADDRESS_GAP);
                        setHexGapChars(DEFAULT_HEX_GAP);
                        setSectionGapChars(DEFAULT_SECTION_GAP);
                      }}
                    >
                      Reset Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden overscroll-contain">
              {hasSelection && isHexLoading && (
                <div className="grid h-full place-items-center rounded-lg border border-base-300 bg-base-200/30 text-sm text-base-content/70">
                  Loading hex data...
                </div>
              )}

              {hasSelection && hexError && !isHexLoading && (
                <div className="grid h-full place-items-center rounded-lg border border-error/40 bg-error/10 px-4 text-center text-sm text-error">
                  Failed to load preview bytes: {hexError}
                </div>
              )}

              {hasSelection &&
                !isHexLoading &&
                !hexError &&
                hexData &&
                hexData.length > 0 && (
                  <HexViewer
                    key={`hex-theme-${themeVersion}`}
                    data={hexData}
                    theme={hexTheme}
                    fontPx={fontPx}
                    addressGapChars={addressGapChars}
                    hexGapChars={hexGapChars}
                    sectionGapChars={sectionGapChars}
                    className="h-full w-full rounded-lg border border-base-300"
                  />
                )}

              {hasSelection &&
                !isHexLoading &&
                !hexError &&
                hexData &&
                hexData.length === 0 && (
                <div className="grid h-full place-items-center rounded-lg border border-base-300 bg-base-200/30 text-sm text-base-content/70">
                    The selected item is empty.
                  </div>
                )}

              {!hasSelection && (
                <div className="grid h-full place-items-center rounded-lg border border-base-300 bg-base-200/30 text-sm text-base-content/70">
                  Select a file or folder to view hex content.
                </div>
              )}
            </div>
          </div>
        ) : selectedTab === 1 ? (
          <StringsViewer
            hasFile={hasSelection}
            strings={stringsData}
            isLoading={isStringsLoading}
            error={stringsError}
            scannedBytes={stringsScannedBytes}
            truncated={stringsTruncated}
            minLength={minStringsLength}
            onMinLengthChange={(value) =>
              setMinStringsLength(
                Number.isFinite(value)
                  ? Math.max(2, Math.min(64, value))
                  : DEFAULT_MIN_STRINGS_LENGTH,
              )
            }
          />
        ) : selectedTab === 5 ? (
          <div className="h-full overflow-auto rounded-lg border border-base-300 bg-base-100 p-3">
            {isMetadataLoading && (
              <div className="grid h-full place-items-center text-sm text-base-content/70">
                Loading metadata...
              </div>
            )}

            {!isMetadataLoading && metadataError && (
              <div className="grid h-full place-items-center px-4 text-center text-sm text-error">
                Failed to load metadata: {metadataError}
              </div>
            )}

            {!isMetadataLoading && !metadataError && !pathMetadata && !metadataView && (
              <div className="grid h-full place-items-center text-sm text-base-content/70">
                Select a file or folder to view metadata.
              </div>
            )}

            {!isMetadataLoading && !metadataError && pathMetadata && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-base-content/90">
                  Metadata
                </h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra table-sm">
                    <tbody>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Name
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {metadataTarget
                            ? `${metadataTarget.imagePath}${pathMetadata.path}`
                            : pathMetadata.path}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Type
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.type_label}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          MIME Type
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.mime_type}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Size
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.size}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          File Name Allocation
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.file_name_allocation}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Metadata Allocation
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.metadata_allocation}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Modified
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {formatTimestamp(pathMetadata.modified)}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Accessed
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {formatTimestamp(pathMetadata.accessed)}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Created
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {formatTimestamp(pathMetadata.created)}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Changed
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {formatTimestamp(pathMetadata.changed)}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          MD5
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.md5}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          SHA-256
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.sha256}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Hash Lookup Results
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.hash_lookup_results}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Internal ID
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.internal_id}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-sm font-semibold text-base-content/90">
                  From The Sleuth Kit istat Tool
                </h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra table-sm">
                    <tbody>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          inode
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.istat_inode}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Allocation
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.istat_allocated ? "Allocated" : "Unallocated"}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Group
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.istat_group ?? "Unknown"}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Generation Id
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.istat_generation_id ?? "Unknown"}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          uid / gid
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.istat_uid} / {pathMetadata.istat_gid}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          mode
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.istat_mode}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          size
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.istat_size}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          num of links
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {pathMetadata.istat_num_links}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-sm font-semibold text-base-content/90">Inode Times</h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra table-sm">
                    <tbody>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Accessed
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {formatTimestampWithParenZone(pathMetadata.istat_accessed)}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          File Modified
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {formatTimestampWithParenZone(
                            pathMetadata.istat_file_modified,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-56 align-top font-semibold text-base-content/80">
                          Inode Modified
                        </td>
                        <td className="font-mono text-xs text-base-content/90">
                          {formatTimestampWithParenZone(
                            pathMetadata.istat_inode_modified,
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-sm font-semibold text-base-content/90">Direct Blocks</h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra table-sm">
                    <tbody>
                      {pathMetadata.istat_direct_blocks.length === 0 && (
                        <tr>
                          <td className="w-56 align-top font-semibold text-base-content/80">
                            Starting address
                          </td>
                          <td className="font-mono text-xs text-base-content/90">
                            Unknown
                          </td>
                        </tr>
                      )}
                      {pathMetadata.istat_direct_blocks.map((block, index) => (
                        <tr key={`${block.start}-${block.length}-${index}`}>
                          <td className="w-56 align-top font-semibold text-base-content/80">
                            Starting address
                          </td>
                          <td className="font-mono text-xs text-base-content/90">
                            {block.start}, length: {block.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!isMetadataLoading && !metadataError && !pathMetadata && metadataView && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-base-content/90">
                  {metadataView.title}
                </h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra table-sm">
                    <tbody>
                      {metadataView.rows.map((row) => (
                        <tr key={row.label}>
                          <td className="w-48 align-top font-semibold text-base-content/80">
                            {row.label}
                          </td>
                          <td className="font-mono text-xs text-base-content/90">
                            {row.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid h-full place-items-center rounded-lg border border-base-300 bg-base-200/30 px-4 text-center text-sm text-base-content/60">
            {tabs[selectedTab]} view is not implemented yet.
          </div>
        )}
      </div>
    </section>
  );
};

export default ContentViewer;
