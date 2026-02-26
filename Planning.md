The database will be a server the app starts up when the app itself starts up. The database is a postgres database to be able to add concurrent writes to the database.

### PostgreSQL will be used for the app over sqlite because

Concurrency and UI responsiveness

- **Postgres** supports many simultaneous readers/writers very well (multiple ingest jobs, multiple UI views, background indexing, timelines, keyword search, plugin writes).
- **SQLite** is great for reads, but **writes serialize** (one writer at a time). In an ingest-heavy app (lots of inserts/updates), that can become a bottleneck and cause UI stalls unless you build a bunch of queues/worker buffering.

Performance on large cases

- **Postgres** has a mature query planner, better parallelism options, better indexing tools, and handles very large tables more gracefully (millions–billions of rows, depending on schema/hardware).
- **SQLite** can be fast, but “huge case + lots of indexes + lots of writes + complex joins” is where it often starts to hurt.

Better search and analytics primitives

- **Postgres** gives you strong options (e.g., robust indexing types, full-text search, extensions) that scale and stay maintainable.
- **SQLite** can do FTS (FTS5), but the ecosystem and scalability ceiling are usually lower for “big forensic case” needs.

Reliability and crash safety under heavy ingest

- **Postgres** is designed for heavy concurrent workloads with strong durability, WAL tooling, and better operational visibility (monitoring, locks, slow queries).
- With **SQLite**, a crash mid-ingest is usually fine, but long-running transactions + one-file constraints can make recovery/diagnosis more painful at scale

# High-Level Architecture – Digital Forensics Tool (Autopsy-like)

This document describes a high-level, implementation-oriented architecture for a desktop digital forensics tool similar to Autopsy. The design emphasizes scalability, extensibility, forensic soundness, and performance.

---

## 1. Top-Level Components

### A. Desktop UI (Presentation Layer)

**Responsibilities**

- Case creation, opening, and closing
- Evidence source management (disk images, folders, logical acquisitions)
- Ingest control (start/stop, progress, logs)
- Views:
  - File tree
  - Hex viewer
  - Timeline
  - Keyword search
  - Artifacts
  - Reports

**Design Principles**

- UI never parses evidence directly
- UI communicates only with the Case Service API
- All long-running work is asynchronous

---

### B. Case Service (Application Layer)

Central orchestration layer between UI and backend logic.

**Responsibilities**

- Case lifecycle management
- Evidence source registration
- Ingest job scheduling and coordination
- Plugin loading and execution control
- Event emission (progress, errors, artifact creation)

**Example API**

- `createCase()`
- `openCase()`
- `addEvidenceSource()`
- `startIngest()`
- `queryArtifacts()`

---

### C. Evidence Access Layer

Provides a uniform, read-only abstraction over all evidence types.

**Supported Evidence Sources**

- Raw disk images (dd)
- E01 / AFF4
- VHD / VMDK
- Logical folders
- Memory dumps (separate pipeline)
- Mobile extraction archives (separate pipeline)

**Core Abstractions**

- `EvidenceSource`
- `Volume`
- `FileSystem`
- `FsNode` (file or directory)

**Key Capabilities**

- Random-access read-only streams
- Metadata retrieval
- Hashing (cached)
- Source-agnostic access for plugins

---

### D. Ingest Pipeline (Processing Layer)

Transforms raw evidence into structured forensic artifacts.

**Pipeline Stages**

1. Discovery (partition and filesystem detection)
2. Enumeration (file tree traversal)
3. Extraction (strings, EXIF, thumbnails, DB parsing)
4. Analysis (timelines, correlations, detection)
5. Reporting preparation (tags, bookmarks)

**Execution Model**

- Job queue with worker pool
- Task-based processing:
  - `ProcessFile(fileId)`
  - `ProcessArtifact(artifactId)`
  - `CarveUnallocated(volumeId, range)`

**Design Requirements**

- Idempotent workers
- Crash-safe and resumable ingest
- Batch-oriented database writes

---

### E. Artifact Store (Data Layer)

Persistent storage for all case data and results.

**Core Entities**

- Case metadata
- Evidence sources
- File system nodes
- Artifacts (typed)
- Artifact attributes
- Relationships (graph edges)
- Tags, bookmarks, analyst notes
- Ingest runs and module provenance

**Storage Strategy**

- SQLite for portable, single-user cases
- PostgreSQL for large cases, concurrency, multi-analyst use

---

### F. Search & Query Layer

Decouples UI queries from database schema.

**Responsibilities**

- Keyword and full-text search
- Timeline and faceted queries
- Efficient pagination and sorting
- Cached query results for common views

**Example Queries**

- Keyword search with filters
- Timeline queries by time range and artifact type
- File-to-artifact and artifact-to-artifact navigation

---

### G. Plugin System (Extensibility Layer)

Allows third-party and internal modules to extend functionality.

**Plugin Types**

- File analyzers (EXIF, PE, PDF, browser DBs)
- Artifact analyzers (correlation, enrichment)
- Source analyzers (partition scanning, VSS)
- Carvers (unallocated space)
- Report generators

**Plugin Contract**

- Manifest (name, version, capabilities)
- Entry points:
  - `onCaseOpen()`
  - `processFile()`
  - `processArtifact()`
  - `onIngestComplete()`

**Safety**

- Provenance tracking (module name/version per artifact)
- Optional out-of-process execution for isolation

---

### H. Reporting & Export

Produces consumable outputs from case data.

**Outputs**

- HTML / PDF case reports
- CSV / JSON artifact exports
- Structured machine-readable formats

**Design Rule**

- Reports query through the Query Layer only
- Reports operate on snapshot views of case data

---

## 2. End-to-End Data Flow

1. User creates or opens a case
2. Evidence source is added and fingerprinted
3. Ingest pipeline is started
4. Files are enumerated and processed by plugins
5. Artifacts and relationships are persisted
6. Search indexes are updated incrementally
7. UI queries data through the Query Layer
8. Reports are generated from stable snapshots

---

## 3. Key Architectural Decisions

### A. Evidence Parsing Boundary

- Read-only, stream-based access
- Layered readers: image → volume → filesystem → file stream

---

### B. Artifact Data Model

- Typed artifacts for core forensic objects
- Flexible attribute storage for plugin extensions
- Hybrid schema for performance and extensibility

---

### C. Provenance & Reproducibility

Every artifact stores:

- Module name and version
- Ingest run ID
- Input references (file ID, offsets, hashes)

---

### D. Performance Strategy

- Batch inserts and updates
- Background workers
- Incremental commits
- Cached UI queries
- Large extracted content stored on disk with indexed references

---

## 4. Suggested Project Structure

- ui/
- case/
- evidence/
- ingest/
- artifacts/
- storage/
- search/
- plugins/
- reporting/
- common/

---

## 5. Minimal Viable Architecture (v1)

- Desktop UI
- Case Service
- Evidence access (images + logical folders)
- Single-worker ingest pipeline
- SQLite artifact store (Postgres-ready schema)
- Basic plugin framework
- File tree, keyword search, timeline
- Report generation

---

This architecture supports gradual scaling from a single-user forensic tool to a multi-worker, multi-analyst platform without major redesign.
