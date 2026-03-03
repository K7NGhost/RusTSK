import { useState } from "react";

const DATA_SOURCES_STORAGE_KEY = "rustsk-data-sources";
const LEGACY_CASES_STORAGE_KEY = "rustsk-cases";

export type DataSourceEntry = {
  id: string;
  name: string;
  createdAt: string;
  selectedFiles: string[];
};

const parseStoredEntries = (stored: string | null): DataSourceEntry[] => {
  if (!stored) return [];
  const parsed = JSON.parse(stored) as Partial<DataSourceEntry>[];
  return parsed.map((entry) => ({
    id: entry.id ?? crypto.randomUUID(),
    name: entry.name ?? "",
    createdAt: entry.createdAt ?? new Date().toISOString(),
    selectedFiles: Array.isArray(entry.selectedFiles)
      ? entry.selectedFiles.filter((file): file is string => typeof file === "string")
      : [],
  }));
};

const loadDataSources = (): DataSourceEntry[] => {
  try {
    const stored = localStorage.getItem(DATA_SOURCES_STORAGE_KEY);
    if (stored) return parseStoredEntries(stored);

    // Backward compatibility: migrate legacy case storage if present.
    const legacyStored = localStorage.getItem(LEGACY_CASES_STORAGE_KEY);
    const migrated = parseStoredEntries(legacyStored);
    if (migrated.length > 0) {
      localStorage.setItem(DATA_SOURCES_STORAGE_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return [];
  }
};

const persistDataSources = (dataSources: DataSourceEntry[]) => {
  localStorage.setItem(DATA_SOURCES_STORAGE_KEY, JSON.stringify(dataSources));
};

export const useDataSources = () => {
  const [dataSources, setDataSources] = useState<DataSourceEntry[]>(loadDataSources);

  const normalizeSelectedFiles = (files: string[]) =>
    Array.from(
      new Set(files.map((file) => file.trim()).filter((file) => file.length > 0)),
    );

  /** Adds a data source if one with the same name doesn't already exist. Returns the entry. */
  const addDataSource = (name: string, selectedFiles: string[] = []): DataSourceEntry => {
    const trimmed = name.trim();
    const normalizedFiles = normalizeSelectedFiles(selectedFiles);
    const existing = dataSources.find((entry) => entry.name === trimmed);
    if (existing) {
      if (normalizedFiles.length === 0) return existing;
      const updatedExisting: DataSourceEntry = {
        ...existing,
        selectedFiles: normalizedFiles,
      };
      const updated = dataSources.map((entry) =>
        entry.id === existing.id ? updatedExisting : entry,
      );
      persistDataSources(updated);
      setDataSources(updated);
      return updatedExisting;
    }

    const newDataSource: DataSourceEntry = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: new Date().toISOString(),
      selectedFiles: normalizedFiles,
    };

    const updated = [...dataSources, newDataSource];
    persistDataSources(updated);
    setDataSources(updated);
    return newDataSource;
  };

  /** Removes a data source by id. */
  const removeDataSource = (id: string) => {
    const updated = dataSources.filter((entry) => entry.id !== id);
    persistDataSources(updated);
    setDataSources(updated);
  };

  return { dataSources, addDataSource, removeDataSource };
};
