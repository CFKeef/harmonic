import { useEffect } from "react";
import { getCollectionsMetadata } from "../utils/jam-api";
import CompanyTable from "./CompanyTable";
import CollectionList from "./CollectionsList";
import { CollectionContext } from "../utils/useCollectionId";
import { useSearchParam } from "../utils/useSearchParam";
import { useQuery } from "@tanstack/react-query";

export const CollectionsPage = () => {
  const collectionId = useSearchParam("collection");

  const collectionResponse = useQuery({
    queryKey: ["collections"],
    queryFn: () => getCollectionsMetadata(),
  });

  // initialize selected collection id to first one if not set
  useEffect(() => {
    const firstCollectionId = collectionResponse.data?.[0]?.id;

    if (!collectionId.value && firstCollectionId) {
      collectionId.setValue(firstCollectionId);
    }
  }, [collectionResponse.data]);

  if (!collectionId.value) {
    return (
      <div className="flex gap-4">
        <div className="w-1/5 space-y-2">
          <h2 className=" font-bold border-b  pb-2 text-left">Collections</h2>
        </div>
      </div>
    );
  }

  return (
    <CollectionContext.Provider
      value={{
        value: collectionId.value,
        setValue: collectionId.setValue,
      }}
    >
      <div className="flex gap-4">
        <div className="w-1/5 space-y-2">
          <h2 className=" font-bold border-b  pb-2 text-left">Collections</h2>
          <CollectionList />
        </div>
        <div className="flex flex-col gap-2 w-4/5">
          <CompanyTable />
        </div>
      </div>
    </CollectionContext.Provider>
  );
};
