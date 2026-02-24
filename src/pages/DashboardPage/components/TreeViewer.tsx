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

const TreeViewer = () => {
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
          defaultExpandedItems={["data", "demo", "views", "results", "exif"]}
        >
          <TreeItem
            itemId="data"
            label={treeLabel(<FolderTree size={16} />, "Data Sources")}
          >
            <TreeItem
              itemId="demo"
              label={treeLabel(<HardDrive size={16} />, "Demo_HD.E01")}
            >
              <TreeItem
                itemId="logical"
                label={treeLabel(<Folder size={16} />, "LogicalFileSet1 (1)")}
              />
              <TreeItem
                itemId="small1"
                label={treeLabel(<File size={16} />, "small2.img")}
              />
              <TreeItem
                itemId="small2"
                label={treeLabel(<File size={16} />, "small2.img")}
              />
              <TreeItem
                itemId="outlook"
                label={treeLabel(<File size={16} />, "outlook.dd")}
              />
              <TreeItem
                itemId="cache"
                label={treeLabel(<File size={16} />, "mtd1_cache.bin")}
              />
            </TreeItem>
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
