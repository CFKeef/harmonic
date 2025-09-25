import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import { useState, MouseEvent } from "react";
import { CopyCompaniesAction } from "./CopyCompaniesAction";
import { useCompanyTable } from "./CompanyTable";

const id = "table-controls";

export const TableControls = () => {
  const table = useCompanyTable();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className="flex gap-2">
      {table.isDirty() && (
        <Button onClick={() => table.setRowSelectionModel([])}>Reset</Button>
      )}
      <Button
        id={id}
        aria-controls={open ? id : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        variant="contained"
      >
        Actions
      </Button>
      <Menu
        id={id}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": id,
        }}
      >
        <CopyCompaniesAction closeMenu={handleClose} />
      </Menu>
    </div>
  );
};
