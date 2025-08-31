using BlogCms.Api.Data;
using BlogCms.Api.Domain.Entities;
using BlogCms.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlogCms.Api.Controllers;

/// <summary>
/// Provides read‑only access to blog categories. Categories are primarily managed via seed data
/// or database administration – this controller exposes a simple listing for the client.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly BlogDbContext _db;
    public CategoriesController(BlogDbContext db) => _db = db;

    /// <summary>
    /// Returns all categories ordered alphabetically by name. Anonymous access allowed.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IEnumerable<Category>> GetAll()
    {
        return await _db.Categories.AsNoTracking()
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    /// <summary>
    /// Creates a new category. Admin only.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Category>> Create([FromBody] CreateCategoryRequest request)
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
            Slug = slug
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = category.Id }, category);
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