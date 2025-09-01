using BlogCms.Api.Data;
using BlogCms.Api.Domain.Entities;
using BlogCms.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlogCms.Api.Controllers;

/// <summary>
/// Controller for managing post moderation workflow including approval and rejection processes.
/// Provides endpoints for content review, approval, and rejection with audit trail tracking.
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "Moderation")]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
[ProducesResponseType(typeof(ProblemDetails), 400)]
[ProducesResponseType(typeof(ProblemDetails), 401)]
[ProducesResponseType(typeof(ProblemDetails), 403)]
[ProducesResponseType(typeof(ProblemDetails), 404)]
[ProducesResponseType(typeof(ProblemDetails), 500)]
public class ModerationController : ControllerBase
{
    private readonly BlogDbContext db;
    public ModerationController(BlogDbContext db) { this.db = db; }

    /// <summary>
    /// Retrieves a paginated list of posts pending moderation review.
    /// </summary>
    /// <param name="status">Post status filter. Defaults to "PendingReview".</param>
    /// <param name="page">Page number for pagination (1-based). Defaults to 1.</param>
    /// <param name="pageSize">Number of posts per page. Defaults to 10, maximum 100.</param>
    /// <returns>
    /// <list type="bullet">
    /// <item><description>200 OK - List of posts with moderation status and metadata.</description></item>
    /// <item><description>400 Bad Request - Invalid pagination parameters.</description></item>
    /// <item><description>401 Unauthorized - Missing or invalid authentication token.</description></item>
    /// <item><description>403 Forbidden - User lacks Admin role.</description></item>
    /// </list>
    /// </returns>
    /// <remarks>
    /// This endpoint provides access to posts requiring moderation review:
    /// 
    /// **Supported Status Filters:**
    /// - `PendingReview` - Posts submitted for review (default)
    /// - `Draft` - Draft posts
    /// - `Published` - Published posts
    /// - `Rejected` - Rejected posts
    /// 
    /// **Features:**
    /// - **Pagination**: Configurable page size with reasonable limits
    /// - **Filtering**: Filter by post status
    /// - **Ordering**: Posts ordered by creation date (oldest first)
    /// - **Performance**: Uses database indexing for efficient queries
    /// 
    /// **Required Roles:** Admin
    /// 
    /// Example request:
    /// <code>GET /api/Moderation/posts?status=PendingReview&amp;page=1&amp;pageSize=20</code>
    /// 
    /// Example response:
    /// <code>
    /// {
    ///   "items": [
    ///     {
    ///       "id": 1,
    ///       "title": "New Blog Post Title",
    ///       "slug": "new-blog-post-title",
    ///       "excerpt": "Post excerpt for preview...",
    ///       "status": "PendingReview",
    ///       "authorId": 1,
    ///       "categoryId": 2,
    ///       "createdAt": "2024-01-15T10:00:00Z",
    ///       "updatedAt": "2024-01-15T10:30:00Z"
    ///     }
    ///   ],
    ///   "page": 1,
    ///   "pageSize": 20,
    ///   "total": 5
    /// }
    /// </code>
    /// </remarks>
    [HttpGet("posts")]
    [ProducesResponseType(typeof(PagedResult<PostResponse>), 200)]
    public async Task<ActionResult<PagedResult<PostResponse>>> Pending(
        [FromQuery] string status = "PendingReview",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 100) pageSize = 10;
        var st = Enum.TryParse<PostStatus>(status, out var s) ? s : PostStatus.PendingReview;
        var q = db.Posts.AsNoTracking().Where(p => p.Status == s);
        var total = await q.CountAsync();
        var skip = (page - 1) * pageSize;
        var posts = await q.OrderBy(p => p.CreatedAt)
            .Skip(skip).Take(pageSize).ToListAsync();
        var items = posts.Select(p => new PostResponse
        {
            Id = p.Id,
            Title = p.Title,
            Slug = p.Slug,
            Excerpt = p.Excerpt,
            ContentHtml = p.ContentHtml,
            CoverImageUrl = p.CoverImageUrl,
            Status = p.Status.ToString(),
            AuthorId = p.AuthorId,
            CategoryId = p.CategoryId,
            PublishedAt = p.PublishedAt,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        }).ToList();
        var result = new PagedResult<PostResponse> { Items = items, Page = page, PageSize = pageSize, Total = total };
        return Ok(result);
    }

    [HttpPost("posts/{id:int}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var p = await db.Posts.FirstOrDefaultAsync(x => x.Id == id);
        if (p is null)
            return new ObjectResult(new Microsoft.AspNetCore.Mvc.ProblemDetails { Title = "Post not found", Status = StatusCodes.Status404NotFound }) { StatusCode = StatusCodes.Status404NotFound };
        if (p.Status != PostStatus.PendingReview)
            return new ObjectResult(new Microsoft.AspNetCore.Mvc.ProblemDetails { Title = "Invalid state", Detail = "Post is not pending review.", Status = StatusCodes.Status400BadRequest }) { StatusCode = StatusCodes.Status400BadRequest };
        // set status and publish date
        p.Status = PostStatus.Published;
        p.PublishedAt = DateTime.UtcNow;
        p.UpdatedAt = DateTime.UtcNow;
        // record audit log with actorId
        var actorId = GetActorId();
        db.AuditLogs.Add(new AuditLog { ActorId = actorId, Action = "Approve", Entity = "Post", EntityId = p.Id });
        await db.SaveChangesAsync();
        return Ok(new { success = true, message = "Post approved", postId = p.Id });
    }

    [HttpPost("posts/{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] ModerationDecisionRequest body)
    {
        var p = await db.Posts.FirstOrDefaultAsync(x => x.Id == id);
        if (p is null)
            return new ObjectResult(new Microsoft.AspNetCore.Mvc.ProblemDetails { Title = "Post not found", Status = StatusCodes.Status404NotFound }) { StatusCode = StatusCodes.Status404NotFound };
        // Optional reason: if provided it must be at least 10 chars
        var reason = body?.Reason?.Trim();
        if (!string.IsNullOrEmpty(reason) && reason.Length < 10)
            return new ObjectResult(new Microsoft.AspNetCore.Mvc.ProblemDetails { Title = "Validation failed", Detail = "Reason must be at least 10 characters.", Status = StatusCodes.Status400BadRequest }) { StatusCode = StatusCodes.Status400BadRequest };

        // Reject and clear publication date so it can be edited and resubmitted
        p.Status = PostStatus.Rejected;
        p.PublishedAt = null;
        p.UpdatedAt = DateTime.UtcNow;
        var actorId = GetActorId();
        db.AuditLogs.Add(new AuditLog
        {
            ActorId = actorId,
            Action = "Reject",
            Entity = "Post",
            EntityId = p.Id,
            PayloadJson = System.Text.Json.JsonSerializer.Serialize(new { reason })
        });
        await db.SaveChangesAsync();
        return Ok(new { success = true, message = "Post rejected", reason = reason });
    }

    private int GetActorId()
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        return int.TryParse(idClaim, out var id) ? id : 0;
    }
}
