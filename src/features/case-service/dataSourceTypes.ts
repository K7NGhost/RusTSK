export type FolderNode = {
  name: string;
  path: string;
  meta_addr: number;
  children: FolderNode[];
};

export type FileEntry = {
  name: string;
  path: string;
  parent_path: string;
  meta_addr: number;
};

export type FileSystemTree = {
  id: string;
  label: string;
  offset: number;
  fs_type: string;
  folders: FolderNode[];
  files: FileEntry[];
};

export type DataSourceTree = {
  image_path: string;
  image_name: string;
  filesystems: FileSystemTree[];
};

export type DirectorySelection = {
  sourceImagePath: string;
  filesystemId: string;
  path: string;
};
