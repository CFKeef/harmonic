import { useEffect, useState } from "react";
import { getCollectionsMetadata, ICollection, ICompany } from "../utils/jam-api";
import useApi from "../utils/useApi";
import { cn } from "../utils/cn";
import { Skeleton } from "@mui/material";
import { useCollectionId } from "../utils/useCollectionId";
import CompanyTable from "./CompanyTable";


export const CollectionsPage = () => {
    const { selectedCollectionId, setSelectedCollectionId } = useCollectionId()
    const { data: collectionResponse, error, loading } = useApi(() => getCollectionsMetadata());

    useEffect(() => {
        setSelectedCollectionId(collectionResponse?.[0]?.id);
    }, [collectionResponse]);

    return (
        <div className="flex gap-4">
            <div className="w-1/5">
                <h2 className=" font-bold border-b mb-2 pb-2 text-left">
                    Collections
                </h2>
                <CollectionList
                    loading={loading}
                    items={collectionResponse}
                    selectedCollectionId={selectedCollectionId}
                    setSelectedCollectionId={(id: string) => {
                        setSelectedCollectionId(id)
                    }}
                />
            </div>
            <div className="w-4/5">
                {selectedCollectionId && <CompanyTable selectedCollectionId={selectedCollectionId} />}
            </div>
        </div >
    )
}

type Collection = Pick<ICollection, "id" | "collection_name">

const CollectionList = (props: {
    loading: boolean,
    items?: Collection[]
    selectedCollectionId?: string
    setSelectedCollectionId: (collectionId: string) => void
}) => {
    if (props.loading || !props.items || props.items.length === 0) {
        return <ul className="flex flex-col gap-2 text-left">
            {new Array(10).fill(0).map((_, index) => (
                <li key={index}><Skeleton /></li>
            ))}
        </ul>
    }

    return (
        <ul className="flex flex-col gap-2 text-left">
            {props.items.map((collection) => {
                const isSelected = props.selectedCollectionId === collection.id

                return (
                    <div
                        className={cn("py-1 pl-4 hover:cursor-pointer hover:bg-orange-300", isSelected && "bg-orange-500 font-bold")}
                        onClick={() => {
                            props.setSelectedCollectionId(collection.id);
                        }}
                        key={collection.id}
                    >
                        {collection.collection_name}
                    </div>
                );
            })}
        </ul>
    )
}




