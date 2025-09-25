import { Skeleton } from "@mui/material";
import { cn } from "../utils/cn";
import { getCollectionsMetadata } from "../utils/jam-api";
import { useCollectionId } from "../utils/useCollectionId";
import { useQuery } from "@tanstack/react-query";

const CollectionList = () => {
  const selectedCollectionId = useCollectionId();

  const collectionResponse = useQuery({
    queryKey: ["collections"],
    queryFn: () => getCollectionsMetadata(),
  });

  if (
    collectionResponse.isLoading ||
    !collectionResponse.data ||
    collectionResponse.data.length === 0
  ) {
    return (
      <ul className="flex flex-col gap-2 text-left">
        {new Array(10).fill(0).map((_, index) => (
          <li key={index}>
            <Skeleton />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="flex flex-col gap-2 text-left">
      {collectionResponse.data.map((collection) => {
        const isSelected = selectedCollectionId.value === collection.id;

        return (
          <div
            key={collection.id}
            className={cn(
              "py-1 pl-4 hover:cursor-pointer hover:bg-orange-300",
              isSelected && "bg-orange-500 font-bold",
            )}
            onClick={() => {
              selectedCollectionId.setValue(collection.id);
            }}
          >
            {collection.collection_name}
          </div>
        );
      })}
    </ul>
  );
};

export default CollectionList;
