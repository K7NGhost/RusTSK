import { FolderOpen, History, PlusCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { createPortal } from "react-dom";
import { createCase, getCaseStartupPayload, openCase } from "../api";
import type { CaseSummary } from "../types";

type StartupAction = "create" | "open" | "recent";

type Props = {
  isOpen: boolean;
  onCaseSelected: (caseSummary: CaseSummary) => void;
};

const CaseStartupModal = ({ isOpen, onCaseSelected }: Props) => {
  const [action, setAction] = useState<StartupAction>("create");
  const [caseName, setCaseName] = useState("");
  const [casePath, setCasePath] = useState("");
  const [openCaseIdOrPath, setOpenCaseIdOrPath] = useState("");
  const [recentCases, setRecentCases] = useState<CaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setErrorMessage(null);

    const timeoutPromise = new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error("Case startup load timed out. Please retry."));
      }, 12000);
    });

    Promise.race([getCaseStartupPayload(), timeoutPromise])
      .then((payload) => {
        if (!cancelled) {
          setRecentCases(payload.recentCases);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage(String(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const canCreateCase = useMemo(
    () => caseName.trim().length > 0 && casePath.trim().length > 0,
    [caseName, casePath],
  );

  if (!isOpen) {
    return null;
  }

  const onCreate = async () => {
    if (!canCreateCase) {
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const created = await createCase(caseName.trim(), casePath.trim());
      onCaseSelected(created);
    } catch (err) {
      setErrorMessage(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const onOpen = async (caseLookup: string) => {
    if (!caseLookup.trim()) {
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const opened = await openCase(caseLookup.trim());
      onCaseSelected(opened);
    } catch (err) {
      setErrorMessage(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const browseForPath = async (
    setter: (value: string) => void,
    title: string,
  ) => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        title,
      });
      if (typeof selected === "string" && selected.trim()) {
        setter(selected);
      }
    } catch (err) {
      setErrorMessage(String(err));
    }
  };

  return createPortal(
    <dialog className="modal modal-open z-[99999]" open>
      <div className="modal-box max-w-3xl p-0">
        <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <h3 className="text-lg font-semibold">Select Case</h3>
          <button className="btn btn-ghost btn-sm btn-circle" disabled>
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-base-300 px-5 py-3">
          <div className="tabs tabs-box">
            <button
              className={`tab ${action === "create" ? "tab-active" : ""}`}
              onClick={() => setAction("create")}
            >
              <PlusCircle size={15} /> Create New Case
            </button>
            <button
              className={`tab ${action === "open" ? "tab-active" : ""}`}
              onClick={() => setAction("open")}
            >
              <FolderOpen size={15} /> Open Case
            </button>
            <button
              className={`tab ${action === "recent" ? "tab-active" : ""}`}
              onClick={() => setAction("recent")}
            >
              <History size={15} /> Recent Cases
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          {action === "create" && (
            <div className="space-y-4">
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Case Name</span>
                </div>
                <input
                  className="input input-bordered"
                  placeholder="Incident-001"
                  value={caseName}
                  onChange={(event) => setCaseName(event.target.value)}
                />
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Case Path</span>
                </div>
                <div className="flex gap-2">
                  <input
                    className="input input-bordered flex-1"
                    placeholder="C:\\Cases\\Incident-001"
                    value={casePath}
                    onChange={(event) => setCasePath(event.target.value)}
                  />
                  <button
                    className="btn btn-outline"
                    onClick={() => void browseForPath(setCasePath, "Select Case Folder")}
                    type="button"
                  >
                    Browse...
                  </button>
                </div>
              </label>

              <button
                className="btn btn-primary"
                onClick={onCreate}
                disabled={!canCreateCase || isLoading}
              >
                Create Case
              </button>
            </div>
          )}

          {action === "open" && (
            <div className="space-y-4">
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Case ID or Case Path</span>
                </div>
                <div className="flex gap-2">
                  <input
                    className="input input-bordered flex-1"
                    placeholder="case_... or C:\\Cases\\Incident-001"
                    value={openCaseIdOrPath}
                    onChange={(event) => setOpenCaseIdOrPath(event.target.value)}
                  />
                  <button
                    className="btn btn-outline"
                    onClick={() =>
                      void browseForPath(
                        setOpenCaseIdOrPath,
                        "Select Existing Case Folder",
                      )
                    }
                    type="button"
                  >
                    Browse...
                  </button>
                </div>
              </label>

              <button
                className="btn btn-primary"
                onClick={() => void onOpen(openCaseIdOrPath)}
                disabled={!openCaseIdOrPath.trim() || isLoading}
              >
                Open Case
              </button>
            </div>
          )}

          {action === "recent" && (
            <div className="space-y-3">
              {recentCases.length === 0 && (
                <p className="text-sm text-base-content/70">No recent cases yet.</p>
              )}

              {recentCases.map((item) => (
                <button
                  key={item.id}
                  className="card w-full cursor-pointer border border-base-300 bg-base-100 p-3 text-left transition hover:border-primary/50"
                  onClick={() => void onOpen(item.id)}
                  disabled={isLoading}
                >
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-base-content/70">{item.casePath}</div>
                </button>
              ))}
            </div>
          )}

          {isLoading && <span className="loading loading-spinner loading-sm" />}
          {errorMessage && (
            <div className="alert alert-error text-sm">
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </dialog>,
    document.body,
  );
};

export default CaseStartupModal;
