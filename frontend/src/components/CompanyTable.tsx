import { DataGrid, GridRowSelectionModel } from "@mui/x-data-grid";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getCollectionsById } from "../utils/jam-api";
import { TableControls } from "./TableControls";
import { useCollectionId } from "../utils/useCollectionId";
import { JobProgression } from "./JobProgression";
import { useQuery } from "@tanstack/react-query";

type CompanyTableContext = {
  offset: number;
  setOffset: (offset: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  rowSelectionModel: GridRowSelectionModel;
  setRowSelectionModel: (rowSelectionModel: GridRowSelectionModel) => void;
  isDirty: () => boolean;
};

const CompanyTableContext = createContext<CompanyTableContext | undefined>(
  undefined,
);

export const useCompanyTable = () => {
  const context = useContext(CompanyTableContext);

  if (!context) {
    throw new Error(
      "useCompanyTable must be used within a CompanyTableProvider",
    );
  }

  return context;
};

const useCollection = (props: {
  collectionId: string;
  offset: number;
  pageSize: number;
}) => {
  return useQuery({
    queryKey: ["collection", props.collectionId, props.offset, props.pageSize],
    queryFn: () =>
      getCollectionsById(props.collectionId, props.offset, props.pageSize),
    refetchInterval: 5_000,
  });
};

const CompanyTable = () => {
  const selectedCollectionId = useCollectionId();
  const [offset, setOffset] = useState<number>(0);
  const [pageSize, setPageSize] = useState(25);
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([]);
  // On collection id change, reset table state
  useEffect(() => {
    setOffset(0);
    setRowSelectionModel([]);
  }, [selectedCollectionId.value]);

  const collection = useCollection({
    collectionId: selectedCollectionId.value,
    offset: offset,
    pageSize: pageSize,
  });

  return (
    <CompanyTableContext.Provider
      value={{
        offset,
        setOffset,
        pageSize,
        setPageSize,
        rowSelectionModel,
        setRowSelectionModel,
        isDirty: () => rowSelectionModel.length > 0,
      }}
    >
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <JobProgression job={collection.data?.job} />
          <TableControls />
        </div>
        <DataTable collectionId={selectedCollectionId.value} />
      </div>
    </CompanyTableContext.Provider>
  );
};

const DataTable = (props: { collectionId: string }) => {
  const table = useCompanyTable();

  const collection = useCollection({
    collectionId: props.collectionId,
    offset: table.offset,
    pageSize: table.pageSize,
  });

  const rowCountRef = useRef(collection.data?.total ?? 0);
  const rowCount = useMemo(() => {
    if (collection.data?.total !== undefined) {
      rowCountRef.current = collection.data.total;
    }
    return rowCountRef.current;
  }, [collection.dataUpdatedAt]);

  return (
    <div style={{ height: 600, width: "100%" }}>
      <DataGrid
        rows={collection.data?.companies ?? []}
        loading={collection.isLoading}
        rowHeight={30}
        columns={[
          { field: "liked", headerName: "Liked", width: 90 },
          { field: "id", headerName: "ID", width: 90 },
          { field: "company_name", headerName: "Company Name", width: 200 },
        ]}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 25 },
          },
        }}
        rowCount={rowCount}
        pagination
        checkboxSelection
        keepNonExistentRowsSelected
        onRowSelectionModelChange={(rowSelectionModel) => {
          table.setRowSelectionModel(rowSelectionModel);
        }}
        rowSelectionModel={table.rowSelectionModel}
        paginationMode="server"
        onPaginationModelChange={(newMeta, details) => {
          table.setPageSize(newMeta.pageSize);
          table.setOffset(newMeta.page * newMeta.pageSize);
        }}
      />
    </div>
  );
};

export default CompanyTable;
