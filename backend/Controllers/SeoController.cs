using BlogCms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogCms.Api.Controllers;

/// <summary>
/// Controller for SEO analysis and optimization features
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "SEO")]
[Route("api/[controller]")]
public class SeoController(SeoService seo) : ControllerBase
{
    public record AnalyzeRequest(string Title, string? Excerpt, string ContentHtml, string? FocusKeyword, string? Slug);

    [HttpPost("analyze")]
    [Authorize(Roles="Blogger,Admin")]
    public IActionResult Analyze([FromBody] AnalyzeRequest req)
    {
        var result = seo.Analyze(req.Title, req.Excerpt, req.ContentHtml, req.FocusKeyword, req.Slug);
        return Ok(result);
    }
}
