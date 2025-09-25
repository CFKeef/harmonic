import threading
from queue import Queue, Empty
from backend.mq.messages import (
    BaseMessage,
    ImportCompaniesToCollectionMessage,
    MessageType,
)
import uuid
from typing import Optional, Iterator
from contextlib import contextmanager
from sqlalchemy.orm import sessionmaker, Session
from backend.db import database
from sqlalchemy.dialects.postgresql import insert
import logging


class Worker(threading.Thread):
    def __init__(
        self, queue: Queue[BaseMessage], session_factory: sessionmaker[Session]
    ):
        super(Worker, self).__init__(daemon=True)
        self.id = uuid.uuid4()
        self.queue = queue
        self._stop_event = threading.Event()
        self.session_factory = session_factory

        logger = logging.getLogger(f"worker_{self.id}")

        if not logger.hasHandlers():
            logger.setLevel(logging.INFO)
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        self.logger = logger

    @contextmanager
    def session_scope(self) -> Iterator[Session]:
        session = self.session_factory()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def run(self):
        self.logger.info(f"started")

        while not self._stop_event.is_set():
            try:
                job = self.queue.get(timeout=1)
            except Empty:
                continue
            try:
                next_job = self.process(job)

                if next_job:
                    self.logger.info(
                        f"adding next job to queue: {next_job.id} {next_job.message_type}"
                    )
                    self.queue.put(next_job)
            finally:
                self.queue.task_done()

    def process(self, msg: BaseMessage) -> Optional[BaseMessage]:
        with self.session_scope() as db:
            if msg.message_type == MessageType.IMPORT_COMPANIES_TO_COLLECTION:
                return msg.handle(self.logger, db)
            else:
                self.logger.info(f"received unknown message type: {msg.message_type}")

    def stop(self):
        self._stop_event.set()


class WorkQueue:
    def __init__(self, worker_count: int, session_factory: sessionmaker[Session]):
        self.queue = Queue()
        self.workers = [
            Worker(self.queue, session_factory) for _ in range(worker_count)
        ]

        for worker in self.workers:
            worker.start()

    def add_job(self, job: BaseMessage):
        print(f"Adding job to queue: {job.id} {job.message_type}")
        self.queue.put(job)

    def get_job(self) -> BaseMessage:
        return self.queue.get()

    def stop(self):
        self.queue.join()

        for worker in self.workers:
            worker.stop()

        for worker in self.workers:
            worker.join()


work_queue: Optional[WorkQueue] = None


def init_work_queue(session_factory: sessionmaker[Session]) -> WorkQueue:
    global work_queue
    work_queue = WorkQueue(worker_count=2, session_factory=session_factory)
    print(f"Work queue initialized with {len(work_queue.workers)} workers")


def shutdown_work_queue() -> None:
    if work_queue is None:
        return

    work_queue.stop()


def get_work_queue() -> WorkQueue:
    return work_queue
