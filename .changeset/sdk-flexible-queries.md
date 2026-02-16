---
"@0xslots/sdk": minor
---

Add flexible event queries and price update events

- Make `getSlotCreatedEvents` accept optional parameters instead of requiring `landId`
- Add `getPriceUpdates` query to fetch price update events
- Update all event queries to support flexible filtering with optional `where`, `orderBy`, and `orderDirection` parameters
