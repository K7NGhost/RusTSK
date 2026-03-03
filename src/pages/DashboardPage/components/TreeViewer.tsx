import { Box, Divider, Paper, Typography } from "@mui/material";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import {
  Boxes,
  Eye,
  File,
  FileSearch,
  Folder,
  FolderTree,
  HardDrive,
  MessagesSquare,
  Trash2,
  Users,
} from "lucide-react";

export type ExplorerTreeNode = {
  name: string;
  path: string;
  isDir: boolean;
  children: ExplorerTreeNode[];
};

export type ExplorerDataSource = {
  id: string;
  name: string;
  sourceType: string;
  sourcePath: string;
  nodes: ExplorerTreeNode[];
  error?: string;
};

type Props = {
  dataSources?: ExplorerDataSource[];
};

const treeLabel = (icon: React.ReactNode, label: string) => (
  <Box
    sx={{ display: "flex", alignItems: "center", gap: 1 }}
    className="text-base-content"
  >
    {icon}
    <Typography variant="body2" className="text-base-content">
      {label}
    </Typography>
  </Box>
);

const treeNodeId = (prefix: string, path: string, index: number) =>
  `${prefix}-${index}-${path.replace(/\\/g, "/")}`;

const renderNode = (node: ExplorerTreeNode, prefix: string, index: number): React.ReactNode => {
  const nodeId = treeNodeId(prefix, node.path, index);
  const icon = node.isDir ? <Folder size={16} /> : <File size={16} />;
  if (!node.isDir || node.children.length === 0) {
    return <TreeItem key={nodeId} itemId={nodeId} label={treeLabel(icon, node.name)} />;
  }

  return (
    <TreeItem key={nodeId} itemId={nodeId} label={treeLabel(icon, node.name)}>
      {node.children.map((child, childIndex) =>
        renderNode(child, `${prefix}-${index}`, childIndex),
      )}
    </TreeItem>
  );
};

const TreeViewer = ({ dataSources = [] }: Props) => {
  return (
    <Paper
      className="h-full overflow-hidden rounded-xl bg-base-100 ring-1 ring-base-300 shadow-2xl"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" className="text-base-content">
          EXPLORER
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 1, overflow: "auto" }} className="text-base-content">
        <SimpleTreeView
          sx={{
            color: "hsl(var(--bc))",
            "& .MuiTreeItem-iconContainer": {
              color: "hsl(var(--bc) / 0.8)",
            },
            "& .MuiTreeItem-iconContainer .MuiSvgIcon-root": {
              color: "inherit",
            },
          }}
          defaultExpandedItems={["data", "views", "results", "exif"]}
        >
          <TreeItem
            itemId="data"
            label={treeLabel(<FolderTree size={16} />, "Data Sources")}
          >
            {dataSources.length === 0 ? (
              <TreeItem
                itemId="data-empty"
                label={treeLabel(<File size={16} />, "No data sources added")}
              />
            ) : (
              dataSources.map((dataSource, dataSourceIndex) => (
                <TreeItem
                  key={dataSource.id}
                  itemId={`data-source-${dataSource.id}`}
                  label={treeLabel(<HardDrive size={16} />, dataSource.name)}
                >
                  {dataSource.error && (
                    <TreeItem
                      itemId={`data-source-${dataSource.id}-error`}
                      label={treeLabel(<File size={16} />, `Error: ${dataSource.error}`)}
                    />
                  )}
                  {dataSource.nodes.length === 0 ? (
                    <TreeItem
                      itemId={`data-source-${dataSource.id}-empty`}
                      label={treeLabel(<File size={16} />, dataSource.sourcePath)}
                    />
                  ) : (
                    dataSource.nodes.map((node, nodeIndex) =>
                      renderNode(
                        node,
                        `data-source-${dataSource.id}-${dataSourceIndex}`,
                        nodeIndex,
                      ),
                    )
                  )}
                </TreeItem>
              ))
            )}
          </TreeItem>

          <TreeItem
            itemId="views"
            label={treeLabel(<Eye size={16} />, "Views")}
          >
            <TreeItem
              itemId="filetypes"
              label={treeLabel(<Folder size={16} />, "File Types")}
            >
              <TreeItem
                itemId="ext"
                label={treeLabel(<FileSearch size={16} />, "By Extension")}
              />
              <TreeItem
                itemId="mime"
                label={treeLabel(<FileSearch size={16} />, "By MIME Type")}
              />
            </TreeItem>
            <TreeItem
              itemId="recent"
              label={treeLabel(<FileSearch size={16} />, "Recent Files")}
            />
            <TreeItem
              itemId="deleted"
              label={treeLabel(<Trash2 size={16} />, "Deleted Files")}
            />
          </TreeItem>

          <TreeItem
            itemId="results"
            label={treeLabel(<Boxes size={16} />, "Results")}
          >
            <TreeItem
              itemId="exif"
              label={treeLabel(<FileSearch size={16} />, "EXIF Metadata")}
            />
            <TreeItem
              itemId="contacts"
              label={treeLabel(<Users size={16} />, "Contacts")}
            />
            <TreeItem
              itemId="messages"
              label={treeLabel(<MessagesSquare size={16} />, "Messages")}
            />
            <TreeItem
              itemId="programs"
              label={treeLabel(<File size={16} />, "Installed Programs")}
            />
          </TreeItem>
        </SimpleTreeView>
      </Box>
    </Paper>
  );
};

export default TreeViewer;
