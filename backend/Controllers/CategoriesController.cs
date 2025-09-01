using BlogCms.Api.Data;
using BlogCms.Api.Domain.Entities;
using BlogCms.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlogCms.Api.Controllers;

/// <summary>
/// Controller for managing blog categories and taxonomy.
/// Provides endpoints for retrieving and creating blog categories with automatic slug generation.
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "Categories")]
[Route("api/[controller]")]
[Produces("application/json")]
[ProducesResponseType(typeof(ProblemDetails), 400)]
[ProducesResponseType(typeof(ProblemDetails), 401)]
[ProducesResponseType(typeof(ProblemDetails), 403)]
[ProducesResponseType(typeof(ProblemDetails), 409)]
[ProducesResponseType(typeof(ProblemDetails), 500)]
public class CategoriesController : ControllerBase
{
    private readonly BlogDbContext _db;
    public CategoriesController(BlogDbContext db) => _db = db;

    /// <summary>
    /// Retrieves all blog categories ordered alphabetically by name.
    /// </summary>
    /// <returns>
    /// <list type="bullet">
    /// <item><description>200 OK - List of all categories with their metadata.</description></item>
    /// <item><description>500 Internal Server Error - Database or server errors.</description></item>
    /// </list>
    /// </returns>
    /// <remarks>
    /// This endpoint provides public access to all blog categories:
    /// - **Public Access**: No authentication required
    /// - **Ordering**: Categories sorted alphabetically by name
    /// - **Performance**: Uses database indexing for efficient queries
    /// - **Caching**: Suitable for client-side caching
    /// 
    /// Categories are primarily managed through seed data or database administration,
    /// but this endpoint provides read-only access for client applications.
    /// 
    /// Example response:
    /// <code>
    /// [
    ///   {
    ///     "id": 1,
    ///     "name": "Technology",
    ///     "slug": "technology",
    ///     "description": "Technology-related blog posts",
    ///     "createdAt": "2024-01-01T00:00:00Z",
    ///     "updatedAt": "2024-01-01T00:00:00Z"
    ///   },
    ///   {
    ///     "id": 2,
    ///     "name": "Programming",
    ///     "slug": "programming",
    ///     "description": "Programming tutorials and guides",
    ///     "createdAt": "2024-01-01T00:00:00Z",
    ///     "updatedAt": "2024-01-01T00:00:00Z"
    ///   }
    /// ]
    /// </code>
    /// </remarks>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<CategoryResponse>), 200)]
    public async Task<IEnumerable<CategoryResponse>> GetAll()
    {
        return await _db.Categories.AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryResponse
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();
    }

    /// <summary>
    /// Creates a new blog category with automatic slug generation.
    /// </summary>
    /// <param name="request">Category creation request containing name and optional description.</param>
    /// <returns>
    /// <list type="bullet">
    /// <item><description>201 Created - Category successfully created with generated slug.</description></item>
    /// <item><description>400 Bad Request - Invalid category name or validation errors.</description></item>
    /// <item><description>401 Unauthorized - Missing or invalid authentication token.</description></item>
    /// <item><description>403 Forbidden - User lacks Admin role.</description></item>
    /// <item><description>409 Conflict - Category name already exists.</description></item>
    /// </list>
    /// </returns>
    /// <remarks>
    /// This endpoint creates new blog categories with comprehensive validation:
    /// 
    /// **Validation Rules:**
    /// - Name must be 2-50 characters long
    /// - Name must be unique (case-insensitive)
    /// - Name cannot be empty or whitespace-only
    /// 
    /// **Automatic Features:**
    /// - **Slug Generation**: Automatic URL-friendly slug creation
    /// - **Slug Uniqueness**: Ensures unique slugs with counter suffix if needed
    /// - **Name Normalization**: Trims whitespace and normalizes input
    /// 
    /// **Slug Generation Rules:**
    /// - Converts to lowercase
    /// - Replaces spaces with hyphens
    /// - Replaces "&amp;" with "and", "+" with "plus"
    /// - Removes special characters except alphanumeric and hyphens
    /// - Handles duplicate slugs with numeric suffixes
    /// 
    /// **Required Roles:** Admin
    /// 
    /// Example request:
    /// <code>
    /// {
    ///   "name": "Web Development",
    ///   "description": "Articles about web development technologies and practices"
    /// }
    /// </code>
    /// 
    /// Example response:
    /// <code>
    /// {
    ///   "id": 3,
    ///   "name": "Web Development",
    ///   "slug": "web-development",
    ///   "description": "Articles about web development technologies and practices",
    ///   "createdAt": "2024-01-15T14:30:00Z",
    ///   "updatedAt": "2024-01-15T14:30:00Z"
    /// }
    /// </code>
    /// </remarks>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(CategoryResponse), 201)]
    public async Task<ActionResult<CategoryResponse>> Create([FromBody] CategoryCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name?.Trim()))
            return BadRequest("Category name is required.");

        var name = request.Name.Trim();
        if (name.Length < 2)
            return BadRequest("Category name must be at least 2 characters.");

        if (name.Length > 50)
            return BadRequest("Category name cannot exceed 50 characters.");

        // Check for duplicate names (case-insensitive)
        if (await _db.Categories.AnyAsync(c => c.Name.ToLower() == name.ToLower()))
            return Conflict("A category with this name already exists.");

        // Generate slug
        var slug = Slugify(name);
        var baseSlug = slug;
        var counter = 1;
        
        // Ensure unique slug
        while (await _db.Categories.AnyAsync(c => c.Slug == slug))
        {
            slug = $"{baseSlug}-{counter++}";
        }

        var category = new Category
        {
            Name = name,
            Slug = slug,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        var response = new CategoryResponse
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
        
        return CreatedAtAction(nameof(GetAll), new { id = category.Id }, response);
    }

    private static string Slugify(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        
        var slug = input.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Replace("+", "plus");
        
        // Remove special characters, keep only alphanumeric and hyphens
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", "");
        
        // Clean up multiple hyphens
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-");
        
        return slug.Trim('-');
    }
}