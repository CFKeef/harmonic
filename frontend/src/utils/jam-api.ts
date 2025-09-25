import axios from "axios";
import { z } from "zod";

export interface ICompany {
  id: number;
  company_name: string;
  liked: boolean;
}


export interface IJob {
  id: string;
  status: string;
  message: string;
  source_collection_id: string;
  target_collection_id: string;
}

export interface ICollection {
  id: string;
  collection_name: string;
  companies: ICompany[];
  total: number;
  job: IJob;
}

export type ICollectionMetadata = Pick<ICollection, "id" | "collection_name">

export interface ICompanyBatchResponse {
  companies: ICompany[];
}

const BASE_URL = "http://localhost:8000";

export async function getCompanies(
  offset?: number,
  limit?: number,
): Promise<ICompanyBatchResponse> {
  try {
    const response = await axios.get(`${BASE_URL}/companies`, {
      params: {
        offset,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
}

export async function getCollectionsById(
  id: string,
  offset?: number,
  limit?: number,
): Promise<ICollection> {
  try {
    const response = await axios.get(`${BASE_URL}/collections/${id}`, {
      params: {
        offset,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
}

export async function getCollectionsMetadata(): Promise<ICollectionMetadata[]> {
  try {
    const response = await axios.get(`${BASE_URL}/collections`);
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
}

export const copyCompanyInput = z.object({
  selectedCompanyIds: z.string().array(),
  sourceCollectionId: z.string().min(1),
  targetCollectionId: z.string().min(1),
});

export type CopyCompanyInput = z.infer<typeof copyCompanyInput>;

export async function copyCompanies(args: CopyCompanyInput): Promise<void> {
  try {
    await axios.post(
      `${BASE_URL}/collections/${args.targetCollectionId}/import`,
      {
        source_collection_id: args.sourceCollectionId,
        selected_company_ids: args.selectedCompanyIds,
      },
    );
  } catch (error) {
    console.error("Error copying companies:", error);
    throw error;
  }
}

