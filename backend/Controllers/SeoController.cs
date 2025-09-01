using BlogCms.Api.DTOs;
using BlogCms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogCms.Api.Controllers;

/// <summary>
/// Controller for SEO analysis and optimization features.
/// Provides endpoints for analyzing blog post content and generating SEO recommendations.
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "SEO")]
[Route("api/[controller]")]
[Produces("application/json")]
[ProducesResponseType(typeof(ProblemDetails), 400)]
[ProducesResponseType(typeof(ProblemDetails), 401)]
[ProducesResponseType(typeof(ProblemDetails), 500)]
public class SeoController(SeoService seo) : ControllerBase
{
    /// <summary>
    /// Analyzes blog post content and provides SEO recommendations and scoring.
    /// </summary>
    /// <param name="req">SEO analysis request containing post content and metadata.</param>
    /// <returns>
    /// <list type="bullet">
    /// <item><description>200 OK - SEO analysis results with score and recommendations.</description></item>
    /// <item><description>400 Bad Request - Invalid request data or validation errors.</description></item>
    /// <item><description>401 Unauthorized - Missing or invalid authentication token.</description></item>
    /// </list>
    /// </returns>
    /// <remarks>
    /// This endpoint performs comprehensive SEO analysis on blog post content:
    /// 
    /// **Analysis Features:**
    /// - **Title Analysis**: Length, keyword usage, readability
    /// - **Content Structure**: Heading hierarchy (H1, H2, etc.)
    /// - **Keyword Optimization**: Focus keyword density and placement
    /// - **Image Optimization**: Alt text presence and quality
    /// - **Content Length**: Minimum content requirements
    /// - **Meta Description**: Length and keyword inclusion
    /// - **Internal/External Links**: Link analysis and recommendations
    /// 
    /// **Scoring System:**
    /// - Score ranges from 0-100
    /// - Higher scores indicate better SEO optimization
    /// - Detailed suggestions provided for improvement areas
    /// 
    /// **Required Roles:** Blogger, Admin
    /// 
    /// Example request:
    /// <code>
    /// {
    ///   "title": "Getting Started with ASP.NET Core Development",
    ///   "excerpt": "Learn the fundamentals of building modern web applications with ASP.NET Core framework.",
    ///   "contentHtml": "&lt;h1&gt;Introduction&lt;/h1&gt;&lt;p&gt;ASP.NET Core is a modern web framework...&lt;/p&gt;",
    ///   "focusKeyword": "ASP.NET Core",
    ///   "slug": "getting-started-aspnet-core"
    /// }
    /// </code>
    /// 
    /// Example response:
    /// <code>
    /// {
    ///   "score": 85,
    ///   "suggestions": [
    ///     {
    ///       "type": "title",
    ///       "message": "Title length is optimal (50-60 characters)",
    ///       "severity": "info"
    ///     },
    ///     {
    ///       "type": "keyword",
    ///       "message": "Focus keyword appears in title and first paragraph",
    ///       "severity": "success"
    ///     },
    ///     {
    ///       "type": "headings",
    ///       "message": "Good heading structure with H1 tag present",
    ///       "severity": "success"
    ///     }
    ///   ]
    /// }
    /// </code>
    /// </remarks>
    [HttpPost("analyze")]
    [Authorize(Roles="Blogger,Admin")]
    [ProducesResponseType(typeof(SeoAnalysisResponse), 200)]
    public IActionResult Analyze([FromBody] SeoAnalysisRequest req)
    {
        var result = seo.Analyze(req.Title, req.Excerpt, req.ContentHtml, req.FocusKeyword, req.Slug);
        return Ok(result);
    }
}
