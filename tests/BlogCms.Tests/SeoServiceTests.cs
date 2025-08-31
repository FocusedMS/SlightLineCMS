using BlogCms.Api.Services;
using Xunit;

namespace BlogCms.Tests;

/// <summary>
/// Simple tests for the SEO analyser. These tests exercise a few of the
/// heuristics to ensure suggestions are produced appropriately.
/// </summary>
public class SeoServiceTests
{
    [Fact]
    public void Analyze_ShortTitle_GeneratesTitleSuggestion()
    {
        var seo = new SeoService();
        var result = seo.Analyze("Short", "This is an excerpt that is long enough.", "<p>Valid content with plenty of words." + new string('x', 600) + "</p>", null, null);
        Assert.Contains(result.Suggestions, s => s.Type == "title");
    }

    [Fact]
    public void Analyze_MissingAlt_GeneratesImageSuggestion()
    {
        var seo = new SeoService();
        var html = "<p>Some text</p><img src=\"/a.jpg\">";
        var result = seo.Analyze("Valid Title for SEO testing", "An excerpt long enough to pass.", html, null, null);
        Assert.Contains(result.Suggestions, s => s.Type == "images");
    }
}