import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import AddDataSourceModal from "./components/AddDataSourceModal";
import type { AddedDataSourcePayload } from "./components/AddDataSourceModal";
import ContentViewer from "./components/ContentViewer";
import ResultViewer from "./components/ResultViewer";
import TopToolbar from "./components/TopToolbar";
import TreeViewer from "./components/TreeViewer";
import type { ExplorerDataSource, ExplorerTreeNode } from "./components/TreeViewer";

type TskTreeNode = {
  name: string;
  path: string;
  is_dir: boolean;
  children: TskTreeNode[];
};

const normalizeSelectedPaths = (payload: AddedDataSourcePayload): string[] => {
  const normalizedPaths = Array.from(
    new Set(
      (payload.dataSourceConfig?.paths ?? [])
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  );
  const singlePath = payload.dataSourceConfig?.path?.trim() ?? "";

  if (payload.dataSourceType === "logical-files") {
    if (normalizedPaths.length > 0) return normalizedPaths;
    return singlePath ? [singlePath] : [];
  }

  if (singlePath) return [singlePath];
  return normalizedPaths.slice(0, 1);
};

const toExplorerNode = (node: TskTreeNode): ExplorerTreeNode => ({
  name: node.name,
  path: node.path,
  isDir: node.is_dir,
  children: node.children.map(toExplorerNode),
});

const pathLabel = (path: string) =>
  path.split(/[\\/]/).filter(Boolean).slice(-1)[0] ?? path;

const ResizeHandle = ({ horizontal = false }: { horizontal?: boolean }) => (
  <Separator
    style={{
      background: "hsl(var(--bc) / 0.18)",
      width: horizontal ? "100%" : 6,
      height: horizontal ? 6 : "100%",
      cursor: horizontal ? "row-resize" : "col-resize",
      borderRadius: 4,
      margin: horizontal ? "4px 0" : "0 4px",
    }}
  />
);

const Dashboard = () => {
  const [isAddDataSourceModalOpen, setIsAddDataSourceModalOpen] = useState(false);
  const [explorerDataSources, setExplorerDataSources] = useState<ExplorerDataSource[]>([]);

  const upsertExplorerSource = useCallback((entry: ExplorerDataSource) => {
    setExplorerDataSources((current) => {
      const existingIndex = current.findIndex((item) => item.name === entry.name);
      if (existingIndex < 0) return [...current, entry];
      return current.map((item, index) => (index === existingIndex ? entry : item));
    });
  }, []);

  const handleDataSourceAdded = useCallback(
    async (payload: AddedDataSourcePayload) => {
      const selectedPaths = normalizeSelectedPaths(payload);
      const collectedNodes: ExplorerTreeNode[] = [];
      const errors: string[] = [];

      if (selectedPaths.length === 0) {
        upsertExplorerSource({
          id: crypto.randomUUID(),
          name: payload.hostName,
          sourceType: payload.dataSourceType,
          sourcePath: "(not set)",
          nodes: [],
          error: "No path selected.",
        });
        return;
      }

      for (const selectedPath of selectedPaths) {
        try {
          if (
            payload.dataSourceType === "disk-image-or-vm-file" ||
            payload.dataSourceType === "unallocated-space-image-file" ||
            payload.dataSourceType === "local-disk"
          ) {
            const tree = await invoke<TskTreeNode>("list_dir_tree", {
              imagePath: selectedPath,
              offset: 0,
              rootPath: "/",
              maxDepth: 4,
              maxEntries: 4000,
            });
            collectedNodes.push({
              name: pathLabel(selectedPath),
              path: selectedPath,
              isDir: true,
              children: tree.children.map(toExplorerNode),
            });
          } else {
            collectedNodes.push({
              name: pathLabel(selectedPath),
              path: selectedPath,
              isDir: true,
              children: [],
            });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push(`${pathLabel(selectedPath)}: ${message}`);
          collectedNodes.push({
            name: pathLabel(selectedPath),
            path: selectedPath,
            isDir: false,
            children: [],
          });
        }
      }

      upsertExplorerSource({
        id: crypto.randomUUID(),
        name: payload.hostName,
        sourceType: payload.dataSourceType,
        sourcePath: selectedPaths[0],
        nodes: collectedNodes,
        error: errors.length > 0 ? errors.join(" | ") : undefined,
      });
    },
    [upsertExplorerSource],
  );

  return (
    <div className="flex h-screen flex-col bg-base-200/40">
      <TopToolbar onAddDataSourceClick={() => setIsAddDataSourceModalOpen(true)} />

      <div className="min-h-0 flex-1 p-1">
        <Group orientation="horizontal">
          <Panel defaultSize={24} minSize={16}>
            <div className="h-full p-1">
              <TreeViewer dataSources={explorerDataSources} />
            </div>
          </Panel>

          <ResizeHandle />

          <Panel defaultSize={76} minSize={35}>
            <Group orientation="vertical">
              <Panel defaultSize={58} minSize={30}>
                <div className="h-full p-1">
                  <ResultViewer />
                </div>
              </Panel>

              <ResizeHandle horizontal />

              <Panel defaultSize={42} minSize={22}>
                <div className="h-full p-1">
                  <ContentViewer />
                </div>
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>

      <AddDataSourceModal
        isOpen={isAddDataSourceModalOpen}
        onClose={() => setIsAddDataSourceModalOpen(false)}
        onDataSourceAdded={handleDataSourceAdded}
      />
    </div>
  );
};

export default Dashboard;
