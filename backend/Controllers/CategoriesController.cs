using BlogCms.Api.Data;
using BlogCms.Api.Domain.Entities;
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
}