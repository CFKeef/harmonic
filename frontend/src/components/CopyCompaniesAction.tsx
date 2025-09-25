import {
  Dialog,
  DialogContentText,
  DialogContent,
  DialogTitle,
  MenuItem,
  FormControl,
  InputLabel,
  Portal,
  Select,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { useCompanyTable } from "./CompanyTable";
import {
  copyCompanies,
  copyCompanyInput,
  CopyCompanyInput,
  getCollectionsMetadata,
} from "../utils/jam-api";
import { useSnackbar } from "notistack";
import { useCollectionId } from "../utils/useCollectionId";
import { useModal } from "../utils/useModal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";

import { useForm, SubmitHandler } from "react-hook-form";
import z from "zod";
type Props = {
  closeMenu: () => void;
};

export const CopyCompaniesAction = ({ closeMenu }: Props) => {
  const modal = useModal();
  const table = useCompanyTable();
  const [open, setOpen] = useState(false);
  const selectedCollectionId = useCollectionId();

  const onActionClick = () => {
    setOpen(true);
  };

  const onDialogClose = (reason?: string) => {
    if (reason !== "backdropClick") {
      setOpen(false);
    }
  };

  const isDirty = table.isDirty();

  return (
    <>
      <MenuItem onClick={onActionClick}>
        Copy {isDirty ? "Selected" : "List"}
      </MenuItem>
      <Portal container={() => modal.ref.current}>
        <Dialog open={open} onClose={() => onDialogClose()} keepMounted>
          <DialogTitle>
            {" "}
            Copy {isDirty ? "Selected Companies" : "List"}
          </DialogTitle>
          <DialogContent className="flex flex-col gap-4">
            <DialogContentText>
              Choose a target collection to copy the companies to.
            </DialogContentText>
            <CopyCompaniesForm
              sourceCollectionId={selectedCollectionId.value}
              selectedCompanyIds={table.rowSelectionModel.map((row) =>
                row.toString(),
              )}
              closeDialog={() => {
                onDialogClose();
                closeMenu();
              }}
            />
          </DialogContent>
        </Dialog>
      </Portal>
    </>
  );
};

type FormProps = {
  sourceCollectionId: string;
  selectedCompanyIds: string[];
} & {
  closeDialog: () => void;
};

const formSchema = copyCompanyInput.pick({
  targetCollectionId: true,
});

const CopyCompaniesForm = (props: FormProps) => {
  console.log(props);

  const form = useForm({
    resolver: zodResolver(formSchema),
    shouldUnregister: true,
  });

  const { enqueueSnackbar } = useSnackbar();

  const copyCompanyMutation = useMutation({
    mutationFn: (args: CopyCompanyInput) => {
      return copyCompanies(args);
    },
    onSuccess: () => {
      enqueueSnackbar("Companies started copying", {
        variant: "success",
      });
      props.closeDialog();
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = (data) => {
    copyCompanyMutation.mutate({
      ...data,
      sourceCollectionId: props.sourceCollectionId,
      selectedCompanyIds: props.selectedCompanyIds,
    });
  };

  const collections = useQuery({
    queryKey: ["collections"],
    queryFn: () => getCollectionsMetadata(),
  });

  const selectOptions =
    collections.data
      ?.map((collection) => ({
        label: collection.collection_name,
        value: collection.id,
      }))
      .filter((collection) => collection.value !== props.sourceCollectionId) ??
    [];

  console.log(form.formState.errors);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormControl
        fullWidth
        required
        error={!!form.formState.errors.targetCollectionId}
      >
        <InputLabel id="target">Target Collection</InputLabel>
        <Select
          native
          labelId="target"
          id="target"
          label="Target Collection"
          inputProps={form.register("targetCollectionId")}
          error={!!form.formState.errors.targetCollectionId}
          defaultValue={""}
        >
          {selectOptions.map((collection) => (
            <option key={collection.value} value={collection.value}>
              {collection.label}
            </option>
          ))}
        </Select>
      </FormControl>

      <DialogActions>
        <Button
          onClick={() => {
            form.reset(undefined, { keepDefaultValues: true });
            props.closeDialog();
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={copyCompanyMutation.isPending}
        >
          {copyCompanyMutation.isPending ? (
            <CircularProgress size={20} />
          ) : (
            "Copy"
          )}
        </Button>
      </DialogActions>
    </form>
  );
};
