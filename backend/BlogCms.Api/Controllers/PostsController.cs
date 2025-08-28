using System.Linq;
using System.Security.Claims;
using System.Text.RegularExpressions;
using BlogCms.Api.Data;
using BlogCms.Api.Domain.Entities;
using BlogCms.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BlogCms.Api.Utils;

namespace BlogCms.Api.Controllers;

[ApiController]
[ApiExplorerSettings(GroupName = "Posts")]
[Route("api/[controller]")]
[Authorize] // default: auth required; selectively allow anon below
public class PostsController : ControllerBase
{
    private readonly BlogDbContext _db;
    public PostsController(BlogDbContext db) => _db = db;

    // -------------------- Public read (Published only) ----------------------

    /// <summary>
    /// Returns a paged list of published posts for the public home page.  Supports simple
    /// searching on the title or excerpt.  Results are ordered by most recent
    /// publication date.  Response includes an ETag header based off the latest
    /// updated date so clients can perform conditional requests.  If the client
    /// supplies an <c>If-None-Match</c> header that matches the computed ETag the
    /// server will return 304 Not Modified to avoid transferring the same list
    /// repeatedly.
    /// </summary>
    /// <param name="search">Optional term to search the title or excerpt.</param>
    /// <param name="page">Page number (1‑based). Defaults to 1.</param>
    /// <param name="pageSize">Number of items per page. Defaults to 10, max 100.</param>
    [HttpGet]
    [AllowAnonymous]
    [ResponseCache(Duration = 30, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new[] { "search", "page", "pageSize" })]
    public async Task<ActionResult<PagedResult<PostResponse>>> ListPublished(
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 100) pageSize = 10;

        // base query: only published posts
        var query = _db.Posts.AsNoTracking().Where(p => p.Status == PostStatus.Published);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(p => p.Title.Contains(term) || (p.Excerpt ?? string.Empty).Contains(term));
        }

        var total = await query.CountAsync();
        // compute ETag from the most recently updated row; strong ETags require quotes
        var latestUpdated = await query.OrderByDescending(p => p.UpdatedAt).Select(p => p.UpdatedAt).FirstOrDefaultAsync();
        var etagValue = latestUpdated == default ? null : $"\"{latestUpdated.Ticks}\"";
        var ifNone = Request.Headers["If-None-Match"].FirstOrDefault();
        if (etagValue != null && ifNone == etagValue)
        {
            // no changes since last fetch
            return StatusCode(StatusCodes.Status304NotModified);
        }

        var skip = (page - 1) * pageSize;
        var posts = await query.OrderByDescending(p => p.PublishedAt)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync();

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

        var result = new PagedResult<PostResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            Total = total
        };
        if (etagValue != null) Response.Headers.ETag = etagValue;
        return Ok(result);
    }

    // GET: api/Posts/{slug}
    /// <summary>
    /// Retrieves a published post by its slug.  Adds an ETag header derived from the
    /// post's last update and honours the <c>If-None-Match</c> header for
    /// conditional GETs.  Returns 404 if no published post is found with the
    /// given slug.
    /// </summary>
    [HttpGet("{slug}", Order = 100)]
    [AllowAnonymous]
    public async Task<ActionResult<PostResponse>> GetBySlug(string slug)
    {
        var p = await _db.Posts.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Slug == slug && x.Status == PostStatus.Published);

        if (p is null)
            return new ObjectResult(new ProblemDetails { Title = "Post not found", Status = StatusCodes.Status404NotFound }) { StatusCode = StatusCodes.Status404NotFound };

        // compute ETag from UpdatedAt; strong ETag must be quoted
        var etag = $"\"{p.UpdatedAt.Ticks}\"";
        var ifNone = Request.Headers["If-None-Match"].FirstOrDefault();
        if (ifNone == etag)
        {
            return StatusCode(StatusCodes.Status304NotModified);
        }
        Response.Headers.ETag = etag;
        return Ok(MapToResponse(p));
    }

    // -------------------- Authenticated (owner/admin) -----------------------

    // GET: api/Posts/me
    [HttpGet("me", Order = -1)]
    public async Task<ActionResult<IEnumerable<PostResponse>>> GetMine()
    {
        var uid = GetActorId();
        if (uid <= 0) return Unauthorized(new { message = "Invalid token" });

        var items = await _db.Posts.AsNoTracking()
            .Where(p => p.AuthorId == uid)
            .OrderByDescending(p => p.UpdatedAt)
            .Select(p => new PostResponse
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
            })
            .ToListAsync();

        return Ok(items);
    }

    // GET: api/Posts/{id}
    [HttpGet("{id:int}", Order = -1)]
    [Authorize(Roles = "Blogger,Admin")]
    public async Task<ActionResult<PostResponse>> GetById(int id)
    {
        var uid = GetActorId();
        if (uid <= 0) return Unauthorized(new { message = "Invalid token" });

        var p = await _db.Posts.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound(new { message = "Post not found" });

        if (p.AuthorId != uid && !User.IsInRole("Admin")) return Forbid();
        return Ok(MapToResponse(p));
    }

    // POST: api/Posts  (create draft)
    [HttpPost]
    [Authorize(Roles = "Blogger,Admin")]
    public async Task<IActionResult> Create([FromBody] PostCreateRequest body)
    {
        if (body is null) return BadRequest(new { message = "Body is required" });

        var uid = GetActorId();
        if (uid <= 0) return Unauthorized(new { message = "Invalid token" });

        var title = body.Title?.Trim();
        if (string.IsNullOrWhiteSpace(title))
            return new ObjectResult(new ProblemDetails { Title = "Validation failed", Detail = "Title is required.", Status = StatusCodes.Status400BadRequest }) { StatusCode = StatusCodes.Status400BadRequest };

        // Generate a slug from the title using the shared helper.  Fallback to a unique guid suffix
        // if the generated slug is empty or already taken.
        var slugBase = SlugGenerator.Generate(title);
        string slug = slugBase;
        if (string.IsNullOrWhiteSpace(slug)) slug = $"post-{Guid.NewGuid():N}";
        if (await _db.Posts.AnyAsync(p => p.Slug == slug))
        {
            var suffix6 = Guid.NewGuid().ToString("N")[..6];
            slug = $"{slug}-{suffix6}";
        }

        // pick a valid category id (or create a default one if none exist)
        var fallbackCategoryId = await _db.Categories
            .OrderBy(c => c.Id)
            .Select(c => c.Id)
            .FirstOrDefaultAsync();

        if (fallbackCategoryId == 0)
        {
            var general = new Category { Name = "General", Slug = "general" };
            _db.Categories.Add(general);
            await _db.SaveChangesAsync(); // get real Id
            fallbackCategoryId = general.Id;
        }

        var categoryId = fallbackCategoryId;
        if (body.CategoryId.HasValue && body.CategoryId.Value > 0)
        {
            var exists = await _db.Categories.AnyAsync(c => c.Id == body.CategoryId.Value);
            if (exists) categoryId = body.CategoryId.Value;
        }

        // Sanitize HTML content to remove scripts/styles and dangerous tags
        var sanitized = BlogCms.Api.Utils.HtmlSanitizerLite.Sanitize(body.ContentHtml ?? string.Empty);

        var post = new Post
        {
            Title = title,
            Slug = slug,
            Excerpt = body.Excerpt,
            ContentHtml = sanitized,
            CoverImageUrl = string.IsNullOrWhiteSpace(body.CoverImageUrl) ? null : body.CoverImageUrl,
            Status = PostStatus.Draft,
            AuthorId = uid,
            CategoryId = categoryId, // valid FK
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        // Persist post
        _db.Posts.Add(post);
        await _db.SaveChangesAsync();

        // Associate tags if provided; ignore unknown IDs
        if (body.TagIds != null && body.TagIds.Any())
        {
            var validTagIds = await _db.Tags.Where(t => body.TagIds.Contains(t.Id)).Select(t => t.Id).ToListAsync();
            foreach (var tid in validTagIds)
            {
                _db.PostTags.Add(new PostTag { PostId = post.Id, TagId = tid });
            }
            if (validTagIds.Count > 0)
            {
                await _db.SaveChangesAsync();
            }
        }

        return CreatedAtAction(nameof(GetById), new { id = post.Id }, MapToResponse(post));
    }

    // PUT: api/Posts/{id}  (update draft)
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Blogger,Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] PostUpdateRequest body)
    {
        var uid = GetActorId();
        if (uid <= 0) return Unauthorized(new { message = "Invalid token" });

        var p = await _db.Posts.FirstOrDefaultAsync(x => x.Id == id);
        if (p is null)
            return new ObjectResult(new ProblemDetails { Title = "Post not found", Status = StatusCodes.Status404NotFound }) { StatusCode = StatusCodes.Status404NotFound };

        if (p.AuthorId != uid && !User.IsInRole("Admin")) return Forbid();

        if (!string.IsNullOrWhiteSpace(body.Title) && body.Title != p.Title)
        {
            p.Title = body.Title.Trim();
            // regenerate slug and ensure it is unique
            var slugBase = SlugGenerator.Generate(p.Title);
            var newSlug = string.IsNullOrWhiteSpace(slugBase) ? $"post-{Guid.NewGuid():N}" : slugBase;
            if (await _db.Posts.AnyAsync(x => x.Id != id && x.Slug == newSlug))
            {
                var suffix6 = Guid.NewGuid().ToString("N")[..6];
                newSlug = $"{newSlug}-{suffix6}";
            }
            p.Slug = newSlug;
        }

        if (body.Excerpt != null) p.Excerpt = body.Excerpt;
        if (body.ContentHtml != null)
        {
            // Sanitize input HTML before storing
            p.ContentHtml = BlogCms.Api.Utils.HtmlSanitizerLite.Sanitize(body.ContentHtml);
        }
        if (body.CoverImageUrl != null)
            p.CoverImageUrl = string.IsNullOrWhiteSpace(body.CoverImageUrl) ? null : body.CoverImageUrl;

        if (body.CategoryId.HasValue && body.CategoryId.Value > 0)
        {
            var exists = await _db.Categories.AnyAsync(c => c.Id == body.CategoryId.Value);
            if (exists) p.CategoryId = body.CategoryId.Value;
        }

        p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Sync tags: remove missing, add new
        if (body.TagIds != null)
        {
            var existingTags = await _db.PostTags.Where(pt => pt.PostId == p.Id).ToListAsync();
            var desired = body.TagIds.ToHashSet();
            // remove tags not in desired
            var toRemove = existingTags.Where(pt => !desired.Contains(pt.TagId)).ToList();
            if (toRemove.Count > 0)
            {
                _db.PostTags.RemoveRange(toRemove);
            }
            // find valid tags to add
            var validTagIds = await _db.Tags.Where(t => desired.Contains(t.Id)).Select(t => t.Id).ToListAsync();
            var toAddIds = validTagIds.Except(existingTags.Select(pt => pt.TagId)).ToList();
            foreach (var tid in toAddIds)
            {
                _db.PostTags.Add(new PostTag { PostId = p.Id, TagId = tid });
            }
            if (toRemove.Count > 0 || toAddIds.Count > 0)
            {
                await _db.SaveChangesAsync();
            }
        }

        return Ok(new { success = true, message = "Draft updated", postId = p.Id });
    }

    // POST: api/Posts/{id}/submit  (send for review)
    [HttpPost("{id:int}/submit")]
    [Authorize(Roles = "Blogger,Admin")]
    public async Task<IActionResult> SubmitForReview(int id)
    {
        var uid = GetActorId();
        if (uid <= 0) return Unauthorized(new { message = "Invalid token" });

        var p = await _db.Posts.FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound(new { message = "Post not found" });
        if (p.AuthorId != uid && !User.IsInRole("Admin")) return Forbid();

        if (p.Status != PostStatus.Draft && p.Status != PostStatus.Rejected)
            return new ObjectResult(new ProblemDetails { Title = "Invalid state", Detail = "Only drafts or rejected posts can be submitted.", Status = StatusCodes.Status400BadRequest }) { StatusCode = StatusCodes.Status400BadRequest };

        p.Status = PostStatus.PendingReview;
        p.UpdatedAt = DateTime.UtcNow;
        // audit
        var actorId = GetActorId();
        _db.AuditLogs.Add(new AuditLog { ActorId = actorId, Action = "SubmitForReview", Entity = "Post", EntityId = p.Id });
        await _db.SaveChangesAsync();
        return Ok(new { success = true, message = "Submitted for review", postId = p.Id });
    }

    // DELETE: api/Posts/{id}
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Blogger,Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var uid = GetActorId();
        if (uid <= 0) return Unauthorized(new { message = "Invalid token" });

        var p = await _db.Posts.FirstOrDefaultAsync(x => x.Id == id);
        if (p is null)
            return new ObjectResult(new ProblemDetails { Title = "Post not found", Status = StatusCodes.Status404NotFound }) { StatusCode = StatusCodes.Status404NotFound };

        if (p.AuthorId != uid && !User.IsInRole("Admin")) return Forbid();

        // Do not allow deletion of published posts to protect published content
        if (p.Status == PostStatus.Published)
        {
            return new ObjectResult(new ProblemDetails { Title = "Forbidden operation", Detail = "Cannot delete a published post.", Status = StatusCodes.Status400BadRequest }) { StatusCode = StatusCodes.Status400BadRequest };
        }

        _db.Posts.Remove(p);
        // audit before commit
        var actorId = GetActorId();
        _db.AuditLogs.Add(new AuditLog { ActorId = actorId, Action = "Delete", Entity = "Post", EntityId = p.Id });
        await _db.SaveChangesAsync();
        return Ok(new { success = true, message = "Post deleted", postId = id });
    }

    // -------------------- helpers --------------------

    private static PostResponse MapToResponse(Post p) => new()
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
    };

    private int GetActorId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value
                   ?? User.FindFirst(ClaimTypes.Name)?.Value;
        return int.TryParse(idClaim, out var id) ? id : 0;
    }

    private static string Slugify(string? title)
    {
        var t = (title ?? "").Trim().ToLowerInvariant();
        t = Regex.Replace(t, @"[^a-z0-9]+", "-");
        t = Regex.Replace(t, @"-+", "-").Trim('-');
        if (string.IsNullOrWhiteSpace(t))
        {
            var g12 = Guid.NewGuid().ToString("N")[..12];
            return $"post-{g12}";
        }
        return t;
    }
}
