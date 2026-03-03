import { Outlet } from "react-router-dom";
import CaseStartupModal from "../features/case-service/components/CaseStartupModal";
import { CaseProvider, useCaseContext } from "../features/case-service/context/CaseContext";

const AppShellContent = () => {
  const { activeCase, setActiveCase } = useCaseContext();

  return (
    <>
      <CaseStartupModal isOpen={!activeCase} onCaseSelected={setActiveCase} />
      <Outlet />
    </>
  );
};

const AppShell = () => (
  <CaseProvider>
    <AppShellContent />
  </CaseProvider>
);

export default AppShell;
