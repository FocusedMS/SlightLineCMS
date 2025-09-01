using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace BlogCms.Api.DTOs;

// Auth
/// <summary>
/// Request model for user registration
/// </summary>
public class RegisterRequest
{
    /// <summary>
    /// User's email address
    /// </summary>
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// User's chosen username (3-32 characters)
    /// </summary>
    [Required]
    [StringLength(32, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// User's password (8-100 characters)
    /// </summary>
    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// Response model for user registration
/// </summary>
public class RegisterResponse
{
    public string Message { get; set; } = "";
}

/// <summary>
/// Request model for user login
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// User's username or email address
    /// </summary>
    [Required]
    [StringLength(64, MinimumLength = 3)]
    public string UsernameOrEmail { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// Response model for successful authentication
/// </summary>
public class AuthResponse
{
    /// <summary>
    /// JWT token for authenticated requests
    /// </summary>
    public string Token { get; set; } = "";
    
    /// <summary>
    /// Token expiration time in seconds
    /// </summary>
    public int ExpiresIn { get; set; } = 3600;
    
    /// <summary>
    /// User information
    /// </summary>
    public object User { get; set; } = new();
}

// Posts
/// <summary>
/// Request model for creating a new blog post
/// </summary>
public class PostCreateRequest
{
    /// <summary>
    /// Post title (3-120 characters)
    /// </summary>
    [Required]
    [StringLength(120, MinimumLength = 3)]
    public string Title { get; set; } = "";

    /// <summary>
    /// Brief excerpt of the post (max 300 characters)
    /// </summary>
    [StringLength(300)]
    public string? Excerpt { get; set; }

    /// <summary>
    /// HTML content of the post (sanitized server-side)
    /// </summary>
    public string ContentHtml { get; set; } = "";

    /// <summary>
    /// Optional category ID for the post
    /// </summary>
    public int? CategoryId { get; set; }
    
    /// <summary>
    /// Optional list of tag IDs for the post
    /// </summary>
    public List<int>? TagIds { get; set; }
    
    /// <summary>
    /// Optional cover image URL for the post
    /// </summary>
    public string? CoverImageUrl { get; set; }
    
    /// <summary>
    /// Optional SEO focus keyword for the post
    /// </summary>
    public string? FocusKeyword { get; set; }
}
/// <summary>
/// Request model for updating an existing blog post
/// </summary>
public class PostUpdateRequest : PostCreateRequest {}

/// <summary>
/// Response model for blog post data
/// </summary>
public class PostResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Slug { get; set; } = "";
    public string? Excerpt { get; set; }
    public string ContentHtml { get; set; } = "";
    public string? CoverImageUrl { get; set; }
    public string Status { get; set; } = "";
    public int AuthorId { get; set; }
    public int? CategoryId { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Moderation
/// <summary>
/// Request model for moderation decisions
/// </summary>
public record ModerationDecisionRequest(string? Reason);

// Categories
/// <summary>
/// Request model for creating a new category
/// </summary>
public class CategoryCreateRequest
{
    [Required]
    [StringLength(50, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(200)]
    public string? Description { get; set; }
}

/// <summary>
/// Request model for updating a category
/// </summary>
public class CategoryUpdateRequest
{
    [Required]
    [StringLength(50, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(200)]
    public string? Description { get; set; }
}

/// <summary>
/// Response model for category data
/// </summary>
public class CategoryResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Media
/// <summary>
/// Request model for media upload
/// </summary>
public class MediaUploadRequest
{
    /// <summary>
    /// The file to upload
    /// </summary>
    [Required] 
    public IFormFile File { get; set; } = default!;
    
    /// <summary>
    /// Optional folder to store the file in (defaults to "posts")
    /// </summary>
    public string? Folder { get; set; } = "posts";
    
    /// <summary>
    /// Optional alt text for the uploaded image
    /// </summary>
    public string? Alt { get; set; }
}

/// <summary>
/// Response model for media data
/// </summary>
public class MediaResponse
{
    public int Id { get; set; }
    public string FileName { get; set; } = "";
    public string FilePath { get; set; } = "";
    public string ContentType { get; set; } = "";
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
    public int UploadedBy { get; set; }
}

/// <summary>
/// Response model for media upload
/// </summary>
public class MediaUploadResponse
{
    public string FileName { get; set; } = "";
    public string Url { get; set; } = "";
    public int Width { get; set; }
    public int Height { get; set; }
    public string? Alt { get; set; }
    public long Size { get; set; }
}

// SEO
/// <summary>
/// Request model for SEO analysis
/// </summary>
public class SeoAnalysisRequest
{
    public string Title { get; set; } = "";
    public string? Excerpt { get; set; }
    public string ContentHtml { get; set; } = "";
    public string? FocusKeyword { get; set; }
    public string? Slug { get; set; }
}

/// <summary>
/// Response model for SEO analysis
/// </summary>
public class SeoAnalysisResponse
{
    public int Score { get; set; }
    public List<SeoSuggestion> Suggestions { get; set; } = new();
}

/// <summary>
/// SEO suggestion model
/// </summary>
public class SeoSuggestion
{
    public string Type { get; set; } = "";
    public string Message { get; set; } = "";
    public string Severity { get; set; } = "";
}

// Pagination
/// <summary>
/// Generic paginated result wrapper
/// </summary>
/// <typeparam name="T">Type of items in the result</typeparam>
public class PagedResult<T>
{
    /// <summary>
    /// Collection of items for the current page
    /// </summary>
    public required IEnumerable<T> Items { get; set; }
    
    /// <summary>
    /// Current page number (1-based)
    /// </summary>
    public int Page { get; set; }
    
    /// <summary>
    /// Number of items per page
    /// </summary>
    public int PageSize { get; set; }
    
    /// <summary>
    /// Total number of items across all pages
    /// </summary>
    public int Total { get; set; }
}

// Analytics DTOs
/// <summary>
/// Dashboard metrics for admin
/// </summary>
public class DashboardMetrics
{
    public PostMetrics Posts { get; set; } = new();
    public UserMetrics Users { get; set; } = new();
    public CategoryMetrics Categories { get; set; } = new();
    public List<RecentPostDto> RecentPosts { get; set; } = new();
    public List<RecentUserDto> RecentUsers { get; set; } = new();
}

/// <summary>
/// Post-related metrics
/// </summary>
public class PostMetrics
{
    public int Total { get; set; }
    public int Last24Hours { get; set; }
    public int Last7Days { get; set; }
    public int Last30Days { get; set; }
    public int Published { get; set; }
    public int Draft { get; set; }
    public int PendingReview { get; set; }
}

/// <summary>
/// User-related metrics
/// </summary>
public class UserMetrics
{
    public int Total { get; set; }
    public int Last24Hours { get; set; }
    public int Last7Days { get; set; }
    public int Last30Days { get; set; }
    public int Active { get; set; }
    public int Inactive { get; set; }
}

/// <summary>
/// Category-related metrics
/// </summary>
public class CategoryMetrics
{
    public int Total { get; set; }
    public int WithPosts { get; set; }
}

/// <summary>
/// Recent post information
/// </summary>
public class RecentPostDto
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Author { get; set; } = "";
    public string Category { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Recent user information
/// </summary>
public class RecentUserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "";
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Category statistics
/// </summary>
public class CategoryStatsDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = "";
    public int TotalPosts { get; set; }
    public int PublishedPosts { get; set; }
    public int DraftPosts { get; set; }
    public int PendingPosts { get; set; }
    public DateTime? LastPostDate { get; set; }
}

/// <summary>
/// User activity statistics
/// </summary>
public class UserActivityDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "";
    public bool IsActive { get; set; }
    public int TotalPosts { get; set; }
    public int PublishedPosts { get; set; }
    public DateTime? LastPostDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// User post activity in recent days
/// </summary>
public class UserPostActivityDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = "";
    public string Role { get; set; } = "";
    public int PostsLast7Days { get; set; }
    public int PublishedLast7Days { get; set; }
    public int DraftLast7Days { get; set; }
    public int PendingLast7Days { get; set; }
}

// User Management DTOs
/// <summary>
/// User management information
/// </summary>
public class UserManagementDto
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "";
    public bool IsActive { get; set; }
    public int TotalPosts { get; set; }
    public int PublishedPosts { get; set; }
    public int DraftPosts { get; set; }
    public int PendingPosts { get; set; }
    public DateTime? LastPostDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Detailed user information
/// </summary>
public class UserDetailDto
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "";
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalPosts { get; set; }
    public int PublishedPosts { get; set; }
    public int DraftPosts { get; set; }
    public int PendingPosts { get; set; }
    public List<UserPostDto> RecentPosts { get; set; } = new();
}

/// <summary>
/// User post information
/// </summary>
public class UserPostDto
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Status { get; set; } = "";
    public string Category { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Request to toggle user status
/// </summary>
public class ToggleUserStatusRequest
{
    public bool IsActive { get; set; }
}
