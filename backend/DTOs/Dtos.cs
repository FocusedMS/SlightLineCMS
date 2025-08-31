using System.ComponentModel.DataAnnotations;

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
    /// User's password (6-100 characters)
    /// </summary>
    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;
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
    [StringLength(100, MinimumLength = 6)]
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
public class CreateCategoryRequest
{
    [Required]
    [StringLength(50, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;
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
