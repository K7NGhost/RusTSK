import { useState } from "react";
import { Outlet } from "react-router-dom";
import CaseStartupModal from "../features/case-service/components/CaseStartupModal";
import { CaseProvider, useCaseContext } from "../features/case-service/context/CaseContext";
import AddDataSourceModal from "../pages/DashboardPage/components/AddDataSourceModal";
import TopToolbar from "../pages/DashboardPage/components/TopToolbar";

const AppShellContent = () => {
  const { activeCase, setActiveCase, addDiskImageDataSource } = useCaseContext();
  const [isAddDataSourceModalOpen, setIsAddDataSourceModalOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <CaseStartupModal isOpen={!activeCase} onCaseSelected={setActiveCase} />
      <TopToolbar onAddDataSourceClick={() => setIsAddDataSourceModalOpen(true)} />
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
      <AddDataSourceModal
        isOpen={isAddDataSourceModalOpen}
        onClose={() => setIsAddDataSourceModalOpen(false)}
        onAddDiskImage={addDiskImageDataSource}
      />
    </div>
  );
};

const AppShell = () => (
  <CaseProvider>
    <AppShellContent />
  </CaseProvider>
);

export default AppShell;
