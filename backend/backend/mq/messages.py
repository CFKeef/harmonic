from operator import and_
from typing import Optional
import uuid
from logging import Logger
from sqlalchemy.orm import Session
from backend.db import database
from sqlalchemy.dialects.postgresql import insert


class MessageType:
    IMPORT_COMPANIES_TO_COLLECTION = "import_companies_to_collection"


class BaseMessage:
    def __init__(self, id: uuid.UUID, message_type: str, payload: dict):
        self.id = id
        self.message_type = message_type
        self.payload = payload

    def handle(self, logger: Logger, db: Session):
        if self.message_type == MessageType.IMPORT_COMPANIES_TO_COLLECTION:
            return ImportCompaniesToCollectionMessage(
                self.id, MessageType.IMPORT_COMPANIES_TO_COLLECTION, self.payload
            ).handle(logger, db)
        else:
            logger.info(f"received unknown message type: {self.message_type}")
            return None


class ImportCompaniesToCollectionMessage(BaseMessage):
    def handle(self, logger: Logger, db: Session) -> Optional[BaseMessage]:
        logger.info(f"importing companies to collection: {self.payload}")

        source_collection_id = self.payload.get("source_collection_id")
        target_collection_id = self.payload.get("target_collection_id")
        selected_company_ids = self.payload.get("selected_company_ids")
        cursor = self.payload.get("cursor", 0)
        batch_size = 25

        query = db.query(
            database.CompanyCollectionAssociation.company_id,
            database.CompanyCollectionAssociation.collection_id,
        ).filter(
            database.CompanyCollectionAssociation.collection_id == source_collection_id
        )

        if len(selected_company_ids) > 0:
            query = query.filter(
                database.CompanyCollectionAssociation.company_id.in_(
                    selected_company_ids
                )
            )

        batch = query.offset(cursor).limit(batch_size + 1).all()
        has_next = len(batch) > batch_size
        if has_next:
            batch.pop()
        cursor += len(batch)

        associations = [
            {
                "collection_id": target_collection_id,
                "company_id": company.company_id,
            }
            for company in batch
        ]

        logger.info(f"Inserting {len(associations)} associations")

        stmt = (
            insert(database.CompanyCollectionAssociation.__table__)
            .values(associations)
            .on_conflict_do_nothing(index_elements=["company_id", "collection_id"])
        )

        db.execute(stmt)
        db.commit()

        state = {
            "source_collection_id": str(source_collection_id),
            "selected_company_ids": selected_company_ids,
            "target_collection_id": str(target_collection_id),
            "cursor": cursor,
        }

        if has_next:
            db.query(database.Job).filter(database.Job.id == self.id).update(
                {"message": f"{cursor} items", "state": state}
            )
            db.commit()

            return BaseMessage(
                id=self.id,
                message_type=MessageType.IMPORT_COMPANIES_TO_COLLECTION,
                payload=state,
            )
        else:
            db.query(database.Job).filter(database.Job.id == self.id).update(
                {
                    "status": "completed",
                    "message": f"{cursor} items",
                    "state": state,
                }
            )
            db.commit()

        return None
