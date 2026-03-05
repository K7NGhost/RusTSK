import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useCaseContext } from "../../features/case-service/context/CaseContext";
import type {
  DirectorySelection,
  SelectedFile,
} from "../../features/case-service/dataSourceTypes";
import AddDataSourceModal from "./components/AddDataSourceModal";
import ContentViewer from "./components/ContentViewer";
import ResultViewer from "./components/ResultViewer";
import TopToolbar from "./components/TopToolbar";
import TreeViewer from "./components/TreeViewer";

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
  const { activeCase, dataSources, addDiskImageDataSource } = useCaseContext();
  const [isAddDataSourceModalOpen, setIsAddDataSourceModalOpen] =
    useState(false);
  const [selectedDirectory, setSelectedDirectory] =
    useState<DirectorySelection | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<DirectorySelection | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  return (
    <div className="flex h-screen flex-col bg-base-200/40">
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
                onDirectorySelected={(selection) => {
                  setSelectedDirectory(selection);
                  setSelectedFile(null);
                  setSelectedFolder(null);
                }}
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
                    selectedFile={selectedFile}
                    onFileSelected={(file) => {
                      setSelectedFile(file);
                      setSelectedFolder(null);
                    }}
                    onDirectorySelected={(selection) => {
                      setSelectedDirectory(selection);
                      setSelectedFile(null);
                      setSelectedFolder(null);
                    }}
                  />
                </div>
              </Panel>

              <ResizeHandle horizontal />

              <Panel defaultSize={42} minSize={22}>
                <div className="h-full p-1">
                  <ContentViewer
                    selectedFile={selectedFile}
                    selectedFolder={selectedFolder}
                    selectedDirectory={selectedDirectory}
                    dataSources={dataSources}
                  />
                </div>
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>

      <AddDataSourceModal
        isOpen={isAddDataSourceModalOpen}
        onClose={() => setIsAddDataSourceModalOpen(false)}
        onAddDiskImage={addDiskImageDataSource}
      />
    </div>
  );
};

export default Dashboard;
