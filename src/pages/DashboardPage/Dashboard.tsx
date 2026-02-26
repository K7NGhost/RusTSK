import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
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
  const [isAddDataSourceModalOpen, setIsAddDataSourceModalOpen] =
    useState(false);

  return (
    <div className="flex h-screen flex-col bg-base-200/40">
      <TopToolbar
        onAddDataSourceClick={() => setIsAddDataSourceModalOpen(true)}
      />

      <div className="min-h-0 flex-1 p-1">
        <Group orientation="horizontal">
          <Panel defaultSize={24} minSize={16}>
            <div className="h-full p-1">
              <TreeViewer />
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
      />
    </div>
  );
};

export default Dashboard;
