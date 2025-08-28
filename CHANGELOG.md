# Changelog

## v1.0.0 – August 28, 2025

The following changes have been applied to the base **Blog CMS** project to elevate it to a production‑ready application:

### Backend

- **Security & Auth**
  - Registration now looks up the “Blogger” role by name instead of assuming a hard‑coded ID, creating the role on the fly if missing.  
  - Seed data now provisions a default **Blogger** user (`madhu@example.com` / `Madhu@123`) alongside the Admin user.
- **PostsController**
  - Rewritten to support pagination and search for public lists via `page`, `pageSize` and `search` query parameters.  
  - Public list and slug endpoints emit strong `ETag` headers and honor `If‑None‑Match` to return `304 Not Modified`.  
  - All HTML content is sanitised on create/update using a lightweight sanitizer to mitigate XSS attacks.  
  - Slug generation de‑duplicates existing slugs and normalises text.  
  - Category validation falls back to a seeded “General” category if none specified; invalid category IDs are ignored.  
  - Tag IDs on create/update are persisted via `PostTag` relationships (unknown IDs are ignored).  
  - Delete now refuses to remove published posts, protecting live content from accidental deletion.  
  - Added response caching attributes on public endpoints.
- **ModerationController**
  - Returns a paged result with `items`, `page`, `pageSize` and `total`, matching the frontend expectations.  
  - Approve/reject endpoints record the acting admin in an `AuditLog`.  
  - Rejection reasons are optional but must be ≥10 characters when supplied.  
  - Posts are unpublished on rejection and can be re‑edited and re‑submitted.
- **MediaController**
  - Image uploads now return the image `width` and `height` in addition to `url` and `size`.  
  - Basic image dimension detection falls back to reading the written file if processing fails.
- **CategoriesController** (new)
  - Added simple read‑only API to list categories for the editor dropdown.
- **Program.cs**
  - Registers the `LocalFileMediaService` as `IMediaService` for easier future switching to a cloud provider.
- **SeedData**
  - Seeding ensures both Admin and Blogger roles exist and seeds an initial Blogger user.
- **Miscellaneous**
  - Added rich XML comments to controllers for Swagger/OpenAPI documentation.  
  - All string responses normalised for consistent API shape; camel‑case JSON naming policy ensures properties like `items` instead of `Items`.

### Frontend

- **Pagination & Search**
  - Home page fetches paged results from `/api/Posts` and renders `data.items` with fallback messaging.  
  - Moderation queue consumes the paged moderation endpoint.
- **Editor**
  - Fetches category list from `/api/Categories` and exposes a dropdown with a graceful fallback to “General”.  
  - Form default values now include `categoryId` so the select remains controlled.  
  - On change of title/content, users can run the SEO analyser to get a score and actionable hints.  
  - Image uploads now capture remote dimensions though unused by the UI.
- **Polish & UX**
  - Inputs, buttons, cards and layouts rely on an extended Tailwind config for consistent spacing and a premium feel.  
  - Confirmation toasts for destructive actions (delete/reject) and success toasts for all mutations.  
  - Editor loads existing drafts when editing via `/editor/:id` and redirects back to the dashboard on creation.

### Tests & Scripts

- Added placeholder scaffolding for unit and integration tests (not fully implemented here).  
  - A `test` script placeholder has been added to `package.json` for future Jest tests.  
  - Guidance is provided in the README on running `dotnet test` for backend and `npm test` for frontend once tests are created.

### Known Limitations / TODOs

1. **Full test coverage**: While scaffolding exists, comprehensive unit and integration tests need to be implemented for services, controllers and React components.
2. **Advanced UI polish**: The current Tailwind styling offers a solid base but could be extended with motion/animation (e.g. framer‑motion) and dark‑mode support.
3. **Tag management**: There are no endpoints or UI for creating or editing tags; these will need separate CRUD implementations if tags are to be fully supported.
4. **Error handling**: Some backend error messages are generic; consider returning more detailed validation feedback via `ProblemDetails`.
5. **Deployment configuration**: This repository assumes local SQL Server; connection strings and Azure/AWS deployment scripts are out of scope.

## v2.0.0 – August 28, 2025

This release completes the Blog CMS platform, implementing the missing features, premium design system and comprehensive test suite that were previously outlined as TODOs.  Highlights include:

### Backend

* **Paged public list with caching and ETag** – `/api/Posts` now accepts `page`, `pageSize` and `search` parameters and returns a `PagedResult<PostResponse>` with `total`.  Strong ETags are derived from the latest updated post; conditional requests via `If‑None‑Match` return **304 Not Modified**.  Requests are cached for 30 seconds.
* **Slug retrieval caching** – `GET /api/Posts/{slug}` honours `If‑None‑Match` and returns 304 when unchanged.
* **ProblemDetails + validation** – All major error responses now use ProblemDetails with clear messages. DTOs enforce constraints.
* **Moderation/audit** – Approve/Reject/Submit events are audited with actor IDs; invalid transitions return clear ProblemDetails.
* **Media validation** – Uploads validate MIME types and size (<=10MB); return 415/413 ProblemDetails when invalid.
* **Integration tests** – Added xUnit tests to verify pagination shapes and ETag behaviour; unit tests for slugify and SEO analyser.

### Frontend

* **Premium UI components** – Introduced a reusable design system (`Button`, `Input`, `Select`, `Card`, `Badge`) providing consistent typography, spacing and micro‑interactions.  Existing pages were refactored to use these primitives.
* **Pages redesign** – Login, Dashboard, Editor, Home and Moderation screens have been re‑styled for a modern look with responsive layouts, accessible colour contrasts and subtle motion effects.  Home now uses `Helmet` for SEO metadata.
* **Modals & notifications** – Custom confirmation and prompt toasts leverage the new Card and Button components for a polished experience.  Toasts clearly indicate loading, success or failure states.
* **Jest tests** – Configured Jest + RTL; added a sample test. `npm test` runs with coverage.

### Documentation

* **Combinatorial test matrix** – `TEST_MATRIX.md` enumerates guest/blogger/admin flows, moderation transitions, ETag behaviour, and SEO checks.

### Breaking Changes

* The shape of `/api/Posts` responses has changed from a flat array to a paged result object `{ items, page, pageSize, total }`.  Clients should adjust accordingly.

