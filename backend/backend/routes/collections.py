from operator import or_
import uuid

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend.db import database
from backend.routes.companies import (
    CompanyBatchOutput,
    fetch_companies_with_liked,
)
from backend.mq.queue import get_work_queue, WorkQueue
from backend.mq.messages import BaseMessage, MessageType
from typing import Optional

router = APIRouter(
    prefix="/collections",
    tags=["collections"],
)


class JobOutput(BaseModel):
    id: uuid.UUID
    source_collection_id: uuid.UUID
    target_collection_id: uuid.UUID
    status: str
    message: Optional[str] = None


class CompanyCollectionMetadata(BaseModel):
    id: uuid.UUID
    collection_name: str
    job: Optional[JobOutput] = None


class CompanyCollectionOutput(CompanyBatchOutput, CompanyCollectionMetadata):
    pass


@router.get("", response_model=list[CompanyCollectionMetadata])
def get_all_collection_metadata(
    db: Session = Depends(database.get_db),
):
    collections = db.query(database.CompanyCollection).all()

    return [
        CompanyCollectionMetadata(
            id=collection.id,
            collection_name=collection.collection_name,
        )
        for collection in collections
    ]


@router.get("/{collection_id}", response_model=CompanyCollectionOutput)
def get_company_collection_by_id(
    collection_id: uuid.UUID,
    offset: int = Query(
        0, description="The number of items to skip from the beginning"
    ),
    limit: int = Query(10, description="The number of items to fetch"),
    db: Session = Depends(database.get_db),
):
    query = (
        db.query(database.CompanyCollectionAssociation, database.Company)
        .join(database.Company)
        .filter(database.CompanyCollectionAssociation.collection_id == collection_id)
    )

    total_count = query.with_entities(func.count()).scalar()

    results = query.offset(offset).limit(limit).all()
    companies = fetch_companies_with_liked(db, [company.id for _, company in results])

    active_job = (
        db.query(
            database.Job.id,
            database.Job.status,
            database.Job.message,
            database.Job.source_collection_id,
            database.Job.target_collection_id,
        )
        .filter(database.Job.status == "active")
        .filter(
            or_(
                database.Job.source_collection_id == collection_id,
                database.Job.target_collection_id == collection_id,
            )
        )
        .limit(1)
    )

    return CompanyCollectionOutput(
        id=collection_id,
        collection_name=db.query(database.CompanyCollection)
        .get(collection_id)
        .collection_name,
        companies=companies,
        total=total_count,
        job=(
            JobOutput(
                id=active_job[0].id,
                status=active_job[0].status,
                message=active_job[0].message,
                source_collection_id=active_job[0].source_collection_id,
                target_collection_id=active_job[0].target_collection_id,
            )
            if active_job.first()
            else None
        ),
    )


class ImportCompaniesToCollectionInput(BaseModel):
    source_collection_id: uuid.UUID
    selected_company_ids: list[int]


class ImportCompaniesToCollectionOutput(BaseModel):
    message: str
    job_id: uuid.UUID


@router.post(
    "/{collection_id}/import", response_model=ImportCompaniesToCollectionOutput
)
def import_companies_to_collection(
    collection_id: uuid.UUID,
    body: ImportCompaniesToCollectionInput,
    db: Session = Depends(database.get_db),
    work_queue: WorkQueue = Depends(get_work_queue),
):
    active_jobs = (
        db.query(database.Job.id)
        .filter(database.Job.status == "active")
        .filter(
            or_(
                database.Job.source_collection_id == body.source_collection_id,
                database.Job.target_collection_id == collection_id,
            )
        )
        .limit(1)
        .all()
    )

    if len(active_jobs) > 0:
        raise HTTPException(
            status_code=400,
            detail="Collection has an active job, please wait for it to finish.",
        )

    state = {
        "source_collection_id": str(body.source_collection_id),
        "selected_company_ids": body.selected_company_ids,
        "target_collection_id": str(collection_id),
        "cursor": 0,
    }
    job_id = uuid.uuid4()
    job = database.Job(
        id=job_id,
        status="active",
        source_collection_id=body.source_collection_id,
        target_collection_id=collection_id,
        state=state,
        message="0 items",
    )

    db.add(job)
    db.commit()

    work_queue.add_job(
        BaseMessage(
            id=job_id,
            message_type=MessageType.IMPORT_COMPANIES_TO_COLLECTION,
            payload=state,
        )
    )

    return ImportCompaniesToCollectionOutput(
        message="Dispatched job!",
        job_id=job_id,
    )
