# Blog CMS API Documentation

## Overview

The Blog CMS API is a comprehensive REST API built with ASP.NET Core 8.0 that provides full functionality for a modern blogging and content management system. This API supports user authentication, content management, SEO analysis, media uploads, and content moderation workflows.

## 🚀 Quick Start

### Base URL
```
https://your-domain.com/api
```

### Authentication
The API uses JWT Bearer token authentication. Include your token in the Authorization header:
```
Authorization: Bearer your-jwt-token-here
```

## 📚 API Groups

### 🔐 Authentication (Auth)
- **POST** `/api/Auth/register` - Register a new user account
- **POST** `/api/Auth/login` - Authenticate and get JWT token

### 📝 Posts
- **GET** `/api/Posts` - Get published posts (public)
- **GET** `/api/Posts/{slug}` - Get post by slug (public)
- **GET** `/api/Posts/me` - Get user's own posts
- **POST** `/api/Posts` - Create new post (draft)
- **PUT** `/api/Posts/{id}` - Update post
- **DELETE** `/api/Posts/{id}` - Delete post
- **POST** `/api/Posts/{id}/submit` - Submit for review

### 🏷️ Categories
- **GET** `/api/Categories` - Get all categories (public)
- **POST** `/api/Categories` - Create new category (Admin only)

### 🔍 SEO Analysis
- **POST** `/api/Seo/analyze` - Analyze post SEO and get recommendations

### 🖼️ Media Management
- **POST** `/api/Media/upload` - Upload and process images

### ⚖️ Moderation
- **GET** `/api/Moderation/posts` - Get posts pending review
- **POST** `/api/Moderation/posts/{id}/approve` - Approve post
- **POST** `/api/Moderation/posts/{id}/reject` - Reject post

## 🔑 Authentication & Authorization

### User Roles
- **Blogger** - Can create, edit, and submit posts for review
- **Admin** - Full access including moderation and category management

### Getting Started
1. Register a new account: `POST /api/Auth/register`
2. Login to get JWT token: `POST /api/Auth/login`
3. Include token in subsequent requests

## 📊 Response Formats

### Success Response
```json
{
  "id": 1,
  "title": "Post Title",
  "content": "Post content...",
  "status": "Published",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "title": "Error Title",
  "detail": "Detailed error message",
  "status": 400
}
```

### Paginated Response
```json
{
  "items": [...],
  "page": 1,
  "pageSize": 10,
  "total": 45
}
```

## 🛠️ Development

### Prerequisites
- .NET 8.0 SDK
- SQL Server or SQLite
- Node.js (for frontend)

### Running Locally
1. Clone the repository
2. Configure connection string in `appsettings.json`
3. Run migrations: `dotnet ef database update`
4. Start the API: `dotnet run`
5. Access Swagger UI: `https://localhost:5001/swagger`

### Testing
```bash
# Run backend tests
cd tests/BlogCms.Tests
dotnet test

# Run frontend tests
cd frontend
npm test
```

## 📋 API Features

### Content Management
- ✅ Create, read, update, delete blog posts
- ✅ Draft, review, and publish workflow
- ✅ Category organization
- ✅ Rich text content with HTML sanitization

### SEO Optimization
- ✅ Automatic SEO analysis and scoring
- ✅ Keyword optimization recommendations
- ✅ Meta description suggestions
- ✅ Image alt text validation

### Media Handling
- ✅ Image upload with automatic optimization
- ✅ Multiple format support (JPEG, PNG, WEBP)
- ✅ Automatic resizing and compression
- ✅ Secure file storage

### User Management
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ User registration and login
- ✅ Password hashing with BCrypt

### Performance & Caching
- ✅ HTTP ETags for conditional requests
- ✅ Response compression
- ✅ Database query optimization
- ✅ Pagination support

## 🔒 Security

### Authentication
- JWT tokens with configurable expiration
- Secure password hashing with BCrypt
- Role-based authorization

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

### File Upload Security
- File type validation
- Size limits enforcement
- Secure filename generation
- Path traversal prevention

## 📈 Monitoring & Logging

### Audit Trail
- User action logging
- Content modification tracking
- Authentication events
- Error logging

### Performance Metrics
- Request duration tracking
- Database query monitoring
- Memory usage tracking
- Error rate monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@blogcms.com
- 📖 Documentation: [API Docs](https://your-domain.com/swagger)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/blog-cms/issues)

---

**Built with ❤️ using ASP.NET Core 8.0**
