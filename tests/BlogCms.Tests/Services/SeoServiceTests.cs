using BlogCms.Api.Services;
using FluentAssertions;
using Xunit;

namespace BlogCms.Tests.Services;

public class SeoServiceTests
{
    private readonly SeoService _seoService = new();

    [Fact]
    public void Analyze_ValidContent_ReturnsHighScore()
    {
        // Arrange
        var title = "This is a perfect title with exactly 50 characters";
        var excerpt = "This is a perfect meta description with exactly 120 characters to meet SEO requirements and provide good user experience.";
        var content = "<h1>Main Title</h1><p>This is the first paragraph with focus keyword.</p><p>More content here.</p>";
        var focusKeyword = "focus keyword";

        // Act
        var result = _seoService.Analyze(title, excerpt, content, focusKeyword, "focus-keyword-slug");

        // Assert
        result.Score.Should().BeGreaterThanOrEqualTo(80);
        result.Suggestions.Should().HaveCountLessThan(10);
    }

    [Fact]
    public void Analyze_ShortTitle_ReducesScore()
    {
        // Arrange
        var title = "Short";
        var content = "<h1>Title</h1><p>Content</p>";

        // Act
        var result = _seoService.Analyze(title, null, content, null, null);

        // Assert
        result.Score.Should().BeLessThan(100);
        result.Suggestions.Should().Contain(s => s.Type == "title");
    }

    [Fact]
    public void Analyze_LongTitle_ReducesScore()
    {
        // Arrange
        var title = "This is a very long title that exceeds the recommended sixty character limit for SEO optimization";
        var content = "<h1>Title</h1><p>Content</p>";

        // Act
        var result = _seoService.Analyze(title, null, content, null, null);

        // Assert
        result.Score.Should().BeLessThan(100);
        result.Suggestions.Should().Contain(s => s.Type == "title");
    }

    [Fact]
    public void Analyze_ShortExcerpt_ReducesScore()
    {
        // Arrange
        var title = "Good Title";
        var excerpt = "Too short";
        var content = "<h1>Title</h1><p>Content</p>";

        // Act
        var result = _seoService.Analyze(title, excerpt, content, null, null);

        // Assert
        result.Score.Should().BeLessThan(100);
        result.Suggestions.Should().Contain(s => s.Type == "description");
    }

    [Fact]
    public void Analyze_KeywordNotInTitle_ReducesScore()
    {
        // Arrange
        var title = "Different Title";
        var content = "<h1>Title</h1><p>Content with focus keyword.</p>";
        var focusKeyword = "focus keyword";

        // Act
        var result = _seoService.Analyze(title, null, content, focusKeyword, null);

        // Assert
        result.Score.Should().BeLessThan(100);
        result.Suggestions.Should().Contain(s => s.Type == "keyword" && s.Message.Contains("title"));
    }

    [Fact]
    public void Analyze_KeywordNotInFirstParagraph_ReducesScore()
    {
        // Arrange
        var title = "Title with focus keyword";
        var content = "<h1>Title</h1><p>First paragraph without keyword.</p><p>Second paragraph with focus keyword.</p>";
        var focusKeyword = "focus keyword";

        // Act
        var result = _seoService.Analyze(title, null, content, focusKeyword, null);

        // Assert
        result.Score.Should().BeLessThan(100);
        result.Suggestions.Should().Contain(s => s.Type == "keyword" && s.Message.Contains("first paragraph"));
    }

    [Fact]
    public void Analyze_NoH1_ReducesScore()
    {
        // Arrange
        var title = "Good Title";
        var content = "<h2>Subtitle</h2><p>Content</p>";

        // Act
        var result = _seoService.Analyze(title, null, content, null, null);

        // Assert
        result.Score.Should().BeLessThan(100);
        result.Suggestions.Should().Contain(s => s.Type == "headings");
    }

    [Fact]
    public void Analyze_MultipleH1_ReducesScore()
    {
        // Arrange
        var title = "Good Title";
        var content = "<h1>First H1</h1><h1>Second H1</h1><p>Content</p>";

        // Act
        var result = _seoService.Analyze(title, null, content, null, null);

        // Assert
        result.Score.Should().BeLessThan(100);
        result.Suggestions.Should().Contain(s => s.Type == "headings");
    }

    [Fact]
    public void Analyze_NoInternalLinks_ReducesScore()
    {
        // Arrange
        var title = "Good Title";
        var content = "<h1>Title</h1><p>Content with <a href=\"https://external.com\">external link</a>.</p>";

        // Act
        var result = _seoService.Analyze(title, null, content, null, null);

        // Assert
        result.Score.Should().BeLessThan(100);
        result.Suggestions.Should().Contain(s => s.Type == "links" && s.Message.Contains("internal"));
    }

    [Fact]
    public void Analyze_NoExternalLinks_ReducesScore()
    {
        // Arrange
        var title = "Good Title";
        var content = "<h1>Title</h1><p>Content with <a href=\"/internal\">internal link</a>.</p>";

        // Act
        var result = _seoService.Analyze(title, null, content, null, null);

        // Assert
        result.Score.Should().BeLessThan(100);
        result.Suggestions.Should().Contain(s => s.Type == "links" && s.Message.Contains("external"));
    }

    [Fact]
    public void Analyze_ImagesWithoutAlt_ReducesScore()
    {
        // Arrange
        var title = "Good Title";
        var content = "<h1>Title</h1><p>Content with <img src=\"image.jpg\"> image.</p>";

        // Act
        var result = _seoService.Analyze(title, null, content, null, null);

        // Assert
        result.Score.Should().BeLessThan(100);
        result.Suggestions.Should().Contain(s => s.Type == "images");
    }

    [Fact]
    public void Analyze_ShortContent_ReducesScore()
    {
        // Arrange
        var title = "Good Title";
        var content = "<h1>Title</h1><p>Short content.</p>";

        // Act
        var result = _seoService.Analyze(title, null, content, null, null);

        // Assert
        result.Score.Should().BeLessThan(100);
        result.Suggestions.Should().Contain(s => s.Type == "length");
    }

    [Fact]
    public void Analyze_LongSentences_ReducesScore()
    {
        // Arrange
        var title = "Good Title";
        var content = "<h1>Title</h1><p>This is a very long sentence that contains many words and should trigger the readability warning because it exceeds the recommended thirty word limit for optimal reading comprehension and user experience.</p>";

        // Act
        var result = _seoService.Analyze(title, null, content, null, null);

        // Assert
        result.Score.Should().BeLessThan(100);
        result.Suggestions.Should().Contain(s => s.Type == "readability");
    }

    [Fact]
    public void Analyze_ScoreNeverBelowZero()
    {
        // Arrange
        var title = "";
        var content = "";

        // Act
        var result = _seoService.Analyze(title, null, content, null, null);

        // Assert
        result.Score.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public void Analyze_ScoreNeverAboveHundred()
    {
        // Arrange
        var title = "Perfect title with exactly 50 characters";
        var excerpt = "Perfect meta description with exactly 120 characters to meet SEO requirements.";
        var content = "<h1>Title</h1><p>Content with <a href=\"/internal\">internal link</a> and <a href=\"https://external.com\">external link</a>. <img src=\"image.jpg\" alt=\"Description\"> Image.</p>";

        // Act
        var result = _seoService.Analyze(title, excerpt, content, null, null);

        // Assert
        result.Score.Should().BeLessThanOrEqualTo(100);
    }
}
