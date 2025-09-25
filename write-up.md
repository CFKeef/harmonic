https://www.youtube.com/watch?v=03za7ECX-Qo

# High Level Design

![[Pasted image 20250925020515.png]]

# Change Log

1. Added prettier and an equivalent to python just to format code
2. Added Tanstack Query as a replacement for useApi + enabling mutative actions
   1. Pretty nice library that deals with server state management + caching across the tree while supporting queries and mutations
   2. https://tanstack.com/query/latest/docs/framework/react/overview
3. Added React-Hook-Form to have access to a nicer dev exp around forms
   1. https://react-hook-form.com/
4. Added zod for validation from front-end to back-end and it hooks in through rhf using a resolver
   1. https://zod.dev/
5. Centralized search param handling using a useSearchParam hook
6. Adds a global toast
7. Adjusted the app’s entrypoint so the CollectionsPage is now the default landing page. This update also establishes a solid provider tree for cleaner context management and more predictable routing
8. Adjusted the select all behavior to keep tracking between table pages and provide a reset button to clear this state
   1. This will be between timestamps 0:03 to 0:09 in the clip
9. Added a Actions button within the collections/\[id] pages to let users copy the entire list or a specific subset of the list to some target collection
   1. ![[Pasted image 20250925022130.png]]

# Assumptions:

1. Support an async workflow so the user can leave and come back
2. Most selection operations are either a few items or the entire collection
3. Users would prefer us to dedupe the collection results and avoid having dupes

# Considerations

1. Row-level vs Collection-level activity
   1. Do we want to expose what rows we are working on?
   2. Would it be sufficient to just do high level with some degree of x tasks completed out of n total?
   3. Decision: Collection-level activity
2. How do we insert?
   1. How do we do it fast?
   2. Decision:
      1. Initially we will just insert using a batch and make use of onConflict handling to skip dupes
      2. Tracking a road map item that will focus on improving performance
3. What happens if our job fails?
   1. Decision:
      1. Job-based system that support step approach to the workflow
4. SSE vs Polling
   1. SSE
      1. Avoids the complexity of a full real-time set up using Websockets
      2. Push-based workflow from server to client so user will be more up-to-date to the state of things on our server
   2. Polling
      1. Simplest to implement and reason about
      2. Trades efficiency for easy of development
         1. It being a pull-based workflows means we will be refetching more frequently then updates happen and just wasting compute to service our requests
   3. Decision: Polling for simplicity but tracking a roadmap item to move to SSE

# Implementation

1. In my case I went for a job-based system for exports where when a user drives through the workflow to copy some subset of a collection it will be initialized in the db with some initial state. 1. Here's the table that encompasses this: 1. ![[Pasted image 20250925024318.png]] 1. Note: I did originally plan to support expanding the jobs to keep the steps as part of the history through the use of the "parentJobId" but this seemed a bit too complicated for the take-home 2. Each job involves a source and target so we map those appropriately alongside using our "state" column to track the selected rows if any. 1. Another option here would be to expand the relation but this table just suits itself as providing some history alongside its workload state plus adding these relations will hurt our insert times since we'll have to juggle more constraints and a more complicated insert process 2. Then the endpoint handle will dispatch the task to a broker (in this case a simple in-memory work queue) to be handled. 1. This work queue has support for more message types using a general BaseMessage and narrowing to specific message types within the worker run function.  
   2. Each message handler should return a next_step in the event we need to orchestrate several steps 1. In my case we just use it to chunk and re-publish the remaining work to be done alongside some state 3. After dispatch the endpoint handler should return a simple message and a id to the job/collection so we can optimistically update

# Roadmap

_pretend these are tickets :)_

## Product

1. Build out an export drawer that provides a centralized view for user to view their active jobs
   1. ![[Pasted image 20250925021445.png]]
   2. Consider something like Posthog's export feature since its clear and provides a nice ui around status updates
      1. ![[posthog.webm]]
2. Adding text search to our data table
   1. Something like this would be easy and a nice improvement: https://ui.shadcn.com/docs/components/data-table
3. Adding filter controls
   1. ![[Pasted image 20250925030318.png]]
   2. https://ui.shadcn.com/examples/tasks
4. Support CRUD workflows around our collection
5. Support CRUD workflows around our collection items
6. Support better status messages around workflow
   1. Currently we provide a raw count of how much we process, we can use our state column to track a more versatile metric to provide to the user
      1. ex: 1/50 items remaining, 33% done

## Infrastructure

1. Set up testing
2. Set up a CI/CD pipeline
3. Set up observability
4. Set up code gen between back-end and front-end to avoid having to juggle two places to update
   1. We already generate docs for our endpoint which might be useful to implementing this
   2. Another option: https://fastapi.tiangolo.com/advanced/generate-clients/
5. Improve work queue implementation around persistence, retry-ability and scalability in terms of throughput
   1. Considerations/Notes:
      1. Looking into just using postgres as our work queue and just having our workers pull for work against it
         1. why:
            1. All state is kept in db -> improving persistence and allowing for retries
            2. Opens us up to separating runners that connect against this seperately from our main service
         2. Links
            1. Good discussion around this here: https://news.ycombinator.com/item?id=39315833
            2. Another article with a pretty standard impl for this: https://aminediro.com/posts/pg_job_queue/
      2. Using step-functions or a workflow engine to get that saga-like orchestration
         1. A workflow is built up from many tasks that each juggle local state which should be able to be paused/retried with the same result once completed
            1. workflow-engine:
               1. Temporal -> previously used and using a managed deployment is nice
                  1. https://temporal.io/
               2. DBoS -> Leans into using postgres for everything
                  1. https://docs.dbos.dev/
            2. step functions:
               1. AWS
      3. Using redis streams or nat jetstream
         1. Can make use of either solution for our caching layer in addition
6. Add SSE for tracking job updates since we are currently polling every 5 seconds
   1. Impls:
      1. for React Query: https://github.com/TanStack/query/discussions/418
      2. Lots of articles around this with fast-api
7. Investigate database insertion speed ups:
   1. If we want to change how we handle the insert parts:
      1. PG Copy streams
         1. Links:
            1. https://www.tigerdata.com/learn/testing-postgres-ingest-insert-vs-batch-insert-vs-copy
            2. https://stackoverflow.com/questions/13125236/sqlalchemy-psycopg2-and-postgresql-copy/24267777
   2. Consider database schema adjustments:
      1. Moving away from using integers as our primary keys would allow us to generate ids in our application layer and avoid having to have the database cut us ids
      2. Moving away from uuid v4s to v7s for b-tree op improvements
         1. https://www.scalingpostgres.com/episodes/302-uuid-vs-bigint-battle/
      3. Associates table could be moved to using a compound key of (company id, collection_id) to avoid having to use a surrogate key when a natural one exists
