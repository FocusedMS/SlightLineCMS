using BlogCms.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace BlogCms.Api.Controllers;

/// <summary>
/// Controller for generating sitemap.xml and robots.txt for SEO purposes
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "SEO")]
[Route("api/[controller]")]
public class SitemapController(BlogDbContext db, IConfiguration cfg) : ControllerBase
{
    [HttpGet("/sitemap.xml")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> Sitemap()
    {
        var baseUrl = cfg["Site:BaseUrl"] ?? "http://localhost:5173";
        var items = await db.Posts.AsNoTracking()
            .Where(p => p.Status == Domain.Entities.PostStatus.Published)
            .OrderByDescending(p => p.PublishedAt)
            .Select(p => new { p.Slug, p.UpdatedAt })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.AppendLine("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
        foreach (var it in items)
        {
            sb.AppendLine("  <url>");
            sb.AppendLine($"    <loc>{baseUrl}/post/{it.Slug}</loc>");
            sb.AppendLine($"    <lastmod>{it.UpdatedAt:yyyy-MM-ddTHH:mm:ssZ}</lastmod>");
            sb.AppendLine("  </url>");
        }
        sb.AppendLine("</urlset>");
        return Content(sb.ToString(), "application/xml", Encoding.UTF8);
    }

    [HttpGet("/robots.txt")]
    [ResponseCache(Duration = 600, Location = ResponseCacheLocation.Any)]
    public IActionResult Robots()
    {
        var lines = new[] {
            "User-agent: *",
            "Disallow: /preview",
            "Allow: /",
            "Sitemap: /sitemap.xml"
        };
        return Content(string.Join("\n", lines), "text/plain", Encoding.UTF8);
    }
}
