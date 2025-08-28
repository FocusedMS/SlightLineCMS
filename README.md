# Sightline CMS

This project is a full‑stack blogging/content management system built with **ASP.NET Core 8**, **React + Vite** and **TypeScript**.  It supports role‑based authentication (Guest, Blogger, Admin), a WYSIWYG editor with image uploads, moderation workflows, SEO analysis and a polished, responsive UI.

## 🧰 Prerequisites

- **.NET 8 SDK** – install from [dotnet.microsoft.com](https://dotnet.microsoft.com/download) and ensure `dotnet --version` reports ≥ 8.0.
- **Node.js 18+** and **npm** – install via [nodejs.org](https://nodejs.org/).  Use `npm -v` to verify.
- **SQL Server** – the API uses SQL Server for persistence.  For local development you can use SQL Server Express or LocalDB.  Update the connection string in `backend/BlogCms.Api/appsettings.Development.json` as appropriate.

## 🚀 Running the App Locally

The frontend and backend are decoupled and can be run independently.  You **do not** need Docker; everything runs via the CLI.

### 0. Environment variables

Create a frontend env file `frontend/.env` (or set via your shell):

```
VITE_API_BASE_URL=http://localhost:5000
```

Backend uses `appsettings.json` / `appsettings.Development.json`. Ensure a `ConnectionStrings:Default` entry like:

```
Server=localhost,1433;Database=BlogCms;User Id=sa;Password=Your_password123;TrustServerCertificate=True;
```

> Tip: On Windows with LocalDB you can also use: `Server=(localdb)\MSSQLLocalDB;Database=BlogCms;Trusted_Connection=True;`.

### 1. Backend

```sh
# Restore packages and build
cd backend/BlogCms.Api
dotnet restore
dotnet build

# Ensure the database exists and apply migrations (runs on first launch)
dotnet run

# The API will start on http://localhost:5000 by default.  See appsettings.json for configuration.
```

By default the seed data creates two users:

- **Admin** – username: `admin`, password: `Admin@123`
- **Blogger** – username: `blogger`, email: `madhu@example.com`, password: `Madhu@123`

You can change or add more users in `SeedData.cs` or via the API once running.

### 2. Frontend

```sh
# Install dependencies
cd frontend
npm install

# Start the Vite dev server
npm run dev

# The frontend runs on http://localhost:5173 and proxies API requests to http://localhost:5000.
```

Make sure the API base URL is set correctly via the `.env` file in the `frontend` folder (e.g. `VITE_API_BASE_URL=http://localhost:5000`).

### 2.1 Frontend scripts

```
npm run dev      # start Vite dev server
npm run build    # typecheck and build for production
npm test         # run jest tests with coverage
```

Recommended (optional) scripts if you add ESLint/Prettier:

```
npm run lint     # eslint . --ext .ts,.tsx
npm run format   # prettier --write "src/**/*.{ts,tsx,css,md}"
```

> **Breaking change (v2)**: The `/api/Posts` endpoint now returns a paged result object `{ items, page, pageSize, total }` instead of an array.  If you have previously integrated against the v1 API you must update your client code to handle the `items` property.

### 3. Running Tests

The repository ships with both backend and frontend test suites.  To run all tests:

```sh
# Backend tests (xUnit + WebApplicationFactory)
cd backend/BlogCms.Api
dotnet test

# Frontend tests (Jest + React Testing Library)
cd ../../frontend
npm test
```

Running the frontend test script will invoke `jest` with coverage enabled.  A sample test for the `Badge` component is located under `src/__tests__`.  You can add additional tests alongside this file.

## 📝 Features

### Authentication & Authorization

- Users register/login via JWT; passwords are hashed with BCrypt.
- Role claim (`role`) is included in the JWT so the frontend can guard routes.
- Default roles: **Blogger** and **Admin**.  Bloggers can create/update their own drafts and submit for review; Admins can approve/reject posts.

### Posts & Moderation

- Bloggers can create drafts, edit them, upload cover images, save and submit for review.
- Admins see a moderation queue and can approve (publishes instantly) or reject (with optional reason) each post.
- Slugs are automatically generated and de‑duplicated.  Only published posts are visible to Guests.
- Deleting a post is restricted to drafts/rejected posts; published posts cannot be deleted.

### Editor & SEO

- Rich text editing powered by **React Quill** with image uploads.  Images are stored under `/wwwroot/media` and resized for performance.
- A sidebar SEO analyser evaluates title/meta length, heading structure, keyword presence, links, alt text, word count and readability.  A score and suggestions are displayed.

### Response Caching & ETags

- Public GET endpoints emit strong `ETag` headers derived from the `UpdatedAt` timestamp.  If the client supplies a matching `If‑None‑Match` header the server returns **304 Not Modified**.
- `[ResponseCache]` attributes cache responses for 30–60 seconds by default.

### API Explorer

- Swagger is enabled in development.  Visit `/swagger` on the API host to explore grouped endpoints (Auth, Posts, Moderation, Media, SEO, Categories).

## 🧪 Demo Script (5–10 minutes)

1. **Register/Login** – Use the register endpoint to create a blogger account or login with the seeded accounts.
2. **Create a Draft** – Navigate to “New Post”, enter a title, write content, upload an image and pick a category.  Save the draft.
3. **SEO Analysis** – Click “Check SEO” to see the score and suggestions update in real‑time.
4. **Submit for Review** – From the dashboard submit the draft for review.  The status changes to “Pending Review”.
5. **Moderation** – Log in as Admin, open the Moderation Queue, approve the post and observe it appear on the home page.  Approving/rejecting shows toast notifications.
6. **ETag Demo** – Refresh a published post in the network tab; note the `ETag` header.  Refresh again to see the browser cache a 304 response.
7. **Swagger Tour** – Open `/swagger`, authorise with a JWT token and call endpoints (upload an image, run SEO analysis, list categories).
8. **Run Tests** – (Once tests are implemented) run `dotnet test` and `npm test` to see unit/integration tests pass.

## 🐞 Troubleshooting

- **Cannot connect to SQL Server** – Update the `Default` connection string in `appsettings.Development.json` to point to your local SQL instance.  The backend will automatically apply migrations and seed data on first run.
- **CORS errors** – Ensure the frontend’s `VITE_API_BASE_URL` matches the backend base URL and that ports are correct.  CORS is configured via the `Cors:FrontendOrigin` setting.
- **Missing images** – Uploaded files are saved to `backend/BlogCms.Api/wwwroot/media`.  Ensure the `wwwroot` directory exists and is writable.

## 📄 License

This project is provided as‑is for educational purposes.  You’re free to extend and adapt it for your own use.