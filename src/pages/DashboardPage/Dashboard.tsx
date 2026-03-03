import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { invoke } from "@tauri-apps/api/core";
import CaseStartupModal from "../../features/case-service/components/CaseStartupModal";
import type { CaseSummary } from "../../features/case-service/types";
import AddDataSourceModal from "./components/AddDataSourceModal";
import ContentViewer from "./components/ContentViewer";
import ResultViewer from "./components/ResultViewer";
import TopToolbar from "./components/TopToolbar";
import TreeViewer from "./components/TreeViewer";

type FolderNode = {
  name: string;
  path: string;
  meta_addr: number;
  children: FolderNode[];
};

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
  folders: FolderNode[];
  files: FileEntry[];
};

type DataSourceTree = {
  image_path: string;
  image_name: string;
  filesystems: FileSystemTree[];
};

type DirectorySelection = {
  sourceImagePath: string;
  filesystemId: string;
  path: string;
};

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
  const [isAddDataSourceModalOpen, setIsAddDataSourceModalOpen] =
    useState(false);
  const [activeCase, setActiveCase] = useState<CaseSummary | null>(null);
  const [dataSources, setDataSources] = useState<DataSourceTree[]>([]);
  const [selectedDirectory, setSelectedDirectory] =
    useState<DirectorySelection | null>(null);

  const handleAddDiskImage = async (imagePath: string) => {
    const tree = await invoke<DataSourceTree>("discover_disk_image_tree", {
      imagePath,
    });

    setDataSources((previous) => {
      const withoutCurrent = previous.filter(
        (source) => source.image_path !== tree.image_path,
      );
      return [...withoutCurrent, tree];
    });
  };

  return (
    <div className="flex h-screen flex-col bg-base-200/40">
      <CaseStartupModal isOpen={!activeCase} onCaseSelected={setActiveCase} />

      <TopToolbar
        onAddDataSourceClick={() => setIsAddDataSourceModalOpen(true)}
      />
      {activeCase && (
        <div className="px-3 py-1 text-xs text-base-content/70">
          Active case: <span className="font-semibold">{activeCase.name}</span>{" "}
          ({activeCase.casePath})
        </div>
      )}

      <div className="min-h-0 flex-1 p-1">
        <Group orientation="horizontal">
          <Panel defaultSize={24} minSize={16}>
            <div className="h-full p-1">
              <TreeViewer
                dataSources={dataSources}
                onDirectorySelected={setSelectedDirectory}
              />
            </div>
          </Panel>

          <ResizeHandle />

          <Panel defaultSize={76} minSize={35}>
            <Group orientation="vertical">
              <Panel defaultSize={58} minSize={30}>
                <div className="h-full p-1">
                  <ResultViewer
                    dataSources={dataSources}
                    selectedDirectory={selectedDirectory}
                  />
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
        onAddDiskImage={handleAddDiskImage}
      />
    </div>
  );
};

export default Dashboard;
