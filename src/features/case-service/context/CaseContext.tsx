import { invoke } from "@tauri-apps/api/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  getCaseDataSourceTrees,
  upsertCaseDataSourceTree,
} from "../api";
import type { DataSourceTree } from "../dataSourceTypes";
import type { CaseSummary } from "../types";

type CaseContextValue = {
  activeCase: CaseSummary | null;
  setActiveCase: (caseSummary: CaseSummary | null) => void;
  dataSources: DataSourceTree[];
  isDataSourcesLoading: boolean;
  dataSourcesError: string | null;
  activeImagePath: string;
  setActiveImagePath: (value: string) => void;
  addDiskImageDataSource: (imagePath: string) => Promise<void>;
};

const CaseContext = createContext<CaseContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export const CaseProvider = ({ children }: Props) => {
  const [activeCase, setActiveCase] = useState<CaseSummary | null>(null);
  const [dataSources, setDataSources] = useState<DataSourceTree[]>([]);
  const [isDataSourcesLoading, setIsDataSourcesLoading] = useState(false);
  const [dataSourcesError, setDataSourcesError] = useState<string | null>(null);
  const [activeImagePath, setActiveImagePathState] = useState("");

  const setActiveImagePath = useCallback(
    (value: string) => {
      setActiveImagePathState(value);
      if (activeCase) {
        localStorage.setItem(`cultivator-active-image-path:${activeCase.id}`, value);
      }
      localStorage.setItem("cultivator-active-image-path", value);
    },
    [activeCase],
  );

  useEffect(() => {
    if (!activeCase) {
      setDataSources([]);
      setActiveImagePathState("");
      setDataSourcesError(null);
      return;
    }

    let cancelled = false;
    setIsDataSourcesLoading(true);
    setDataSourcesError(null);

    void getCaseDataSourceTrees(activeCase.id)
      .then((trees) => {
        if (cancelled) {
          return;
        }
        setDataSources(trees);
        const savedPath = localStorage.getItem(
          `cultivator-active-image-path:${activeCase.id}`,
        );
        const fallbackPath = trees[trees.length - 1]?.image_path ?? "";
        const nextPath = savedPath && savedPath.trim() ? savedPath : fallbackPath;
        setActiveImagePathState(nextPath);
        if (nextPath) {
          localStorage.setItem(`cultivator-active-image-path:${activeCase.id}`, nextPath);
          localStorage.setItem("cultivator-active-image-path", nextPath);
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setDataSources([]);
        setDataSourcesError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) {
          setIsDataSourcesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeCase]);

  const addDiskImageDataSource = useCallback(
    async (imagePath: string) => {
      if (!activeCase) {
        throw new Error("No active case selected");
      }

      const tree = await invoke<DataSourceTree>("discover_disk_image_tree", {
        imagePath,
      });
      await upsertCaseDataSourceTree(activeCase.id, tree);

      setDataSources((previous) => {
        const withoutCurrent = previous.filter(
          (source) => source.image_path !== tree.image_path,
        );
        return [...withoutCurrent, tree];
      });

      setActiveImagePath(tree.image_path);
      setDataSourcesError(null);
    },
    [activeCase, setActiveImagePath],
  );

  const value = useMemo(
    () => ({
      activeCase,
      setActiveCase,
      dataSources,
      isDataSourcesLoading,
      dataSourcesError,
      activeImagePath,
      setActiveImagePath,
      addDiskImageDataSource,
    }),
    [
      activeCase,
      dataSources,
      isDataSourcesLoading,
      dataSourcesError,
      activeImagePath,
      setActiveImagePath,
      addDiskImageDataSource,
    ],
  );

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
};

export const useCaseContext = () => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error("useCaseContext must be used inside CaseProvider");
  }
  return context;
};
