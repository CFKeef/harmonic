import { CircularProgress, Typography } from "@mui/material";
import { IJob } from "../utils/jam-api";
import { useCollectionId } from "../utils/useCollectionId";

export const JobProgression = (props: { job?: IJob }) => {
  const selectedCollectionId = useCollectionId();

  const isExporting =
    props.job?.source_collection_id === selectedCollectionId.value;

  if (!props.job) {
    return <div />;
  }

  return (
    <div className="flex justify-between gap-2">
      <Typography variant="body2" className="capitalize">
        {isExporting ? "Exporting" : "Importing"} {props.job.message}
      </Typography>
      <CircularProgress size={20} />
    </div>
  );
};
