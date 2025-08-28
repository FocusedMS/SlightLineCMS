using BlogCms.Api.Data;
using BlogCms.Api.Domain.Entities;
using BlogCms.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlogCms.Api.Controllers;

[ApiController]
[ApiExplorerSettings(GroupName = "Moderation")]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ModerationController : ControllerBase
{
    private readonly BlogDbContext db;
    public ModerationController(BlogDbContext db) { this.db = db; }

    [HttpGet("posts")]
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
