# Sightline CMS

This project is a full‑stack blogging/content management system built with **ASP.NET Core 8**, **React + Vite** and **TypeScript**. It supports role‑based authentication (Guest, Blogger, Admin), a WYSIWYG editor with image uploads, moderation workflows, SEO analysis and a polished, responsive UI.

## 📁 Project Structure

```
/sightline-cms
├── frontend/          # React + TypeScript frontend
├── backend/           # ASP.NET Core 8 API
├── database/          # SQL Server with EF Core
├── tests/             # Unit and integration tests
└── docs/              # Project documentation
```

## 🧰 Prerequisites

- **.NET 8 SDK** – install from [dotnet.microsoft.com](https://dotnet.microsoft.com/download) and ensure `dotnet --version` reports ≥ 8.0.
- **Node.js 18+** and **npm** – install via [nodejs.org](https://nodejs.org/). Use `npm -v` to verify.
- **SQL Server** – the API uses SQL Server for persistence. For local development you can use SQL Server Express or LocalDB.

## 🚀 Running the App Locally

The frontend and backend are decoupled and can be run independently.

### 1. Backend

```sh
# Navigate to backend directory
cd sightline-cms/backend/BlogCms.Api

# Restore packages and build
dotnet restore
dotnet build

# Run the API (database migrations will be applied automatically)
dotnet run

# The API will start on http://localhost:5000 by default
```

### 2. Frontend

```sh
# Navigate to frontend directory
cd sightline-cms/frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev

# The frontend runs on http://localhost:5173
```

### 3. Environment Configuration

Create a frontend env file `sightline-cms/frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:5000
```

Update the backend connection string in `sightline-cms/backend/BlogCms.Api/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost,1433;Database=BlogCms;User Id=sa;Password=Your_password123;TrustServerCertificate=True;"
  }
}
```

## 👥 Default Users

The system comes with two default users:

- **Admin** – username: `admin`, password: `Admin@123`
- **Blogger** – username: `blogger`, email: `madhu@example.com`, password: `Madhu@123`

## 🧪 Running Tests

```sh
# Backend tests
cd sightline-cms/backend/BlogCms.Api
dotnet test

# Frontend tests
cd sightline-cms/frontend
npm test
```

## 📚 Documentation

- **API Documentation**: Visit `/swagger` on the API host (http://localhost:5000/swagger)
- **Project Documentation**: See `sightline-cms/docs/` directory
- **Test Matrix**: See `sightline-cms/docs/TEST_MATRIX.md`

## 🎯 Features

### Authentication & Authorization
- JWT-based authentication with role-based access control
- Guest, Blogger, and Admin roles
- Secure password hashing with BCrypt

### Content Management
- WYSIWYG editor powered by React Quill
- Image upload and optimization
- Draft, review, and publish workflow
- Automatic slug generation

### SEO & Performance
- Real-time SEO analysis and scoring
- Performance optimization with caching and ETags
- Image optimization and compression

### Moderation
- Admin moderation queue
- Approve/reject workflow with audit logging
- Content lifecycle management

## 🛠️ Technology Stack

### Backend
- ASP.NET Core 8
- Entity Framework Core
- SQL Server
- JWT Authentication
- Swagger/OpenAPI

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Query
- Redux Toolkit

## 📄 License

This project is provided as-is for educational purposes. You're free to extend and adapt it for your own use.
