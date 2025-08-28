using System.ComponentModel.DataAnnotations;

namespace BlogCms.Api.DTOs;

// Auth
public class RegisterRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(32, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required]
    [StringLength(64, MinimumLength = 3)]
    public string UsernameOrEmail { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = "";
    public int ExpiresIn { get; set; } = 3600;
    public object User { get; set; } = new();
}

// Posts
public class PostCreateRequest
{
    [Required]
    [StringLength(120, MinimumLength = 3)]
    public string Title { get; set; } = "";

    [StringLength(300)]
    public string? Excerpt { get; set; }

    // Content may be empty; it's sanitized server-side
    public string ContentHtml { get; set; } = "";

    public int? CategoryId { get; set; }
    public List<int>? TagIds { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? FocusKeyword { get; set; }
}
public class PostUpdateRequest : PostCreateRequest {}

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
public record ModerationDecisionRequest(string? Reason);

// Pagination
public class PagedResult<T>
{
    public required IEnumerable<T> Items { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int Total { get; set; }
}
