using BlogCms.Api.Utils;
using Xunit;

namespace BlogCms.Tests;

/// <summary>
/// Unit tests for the <see cref="SlugGenerator"/> helper.
/// </summary>
public class SlugGeneratorTests
{
    [Theory]
    [InlineData("Hello World", "hello-world")]
    [InlineData("  Multiple   Spaces  ", "multiple-spaces")]
    [InlineData("Special@#$%^&*()Characters", "special-characters")]
    [InlineData("UPPERCASE TEXT", "uppercase-text")]
    [InlineData("Numbers123", "numbers123")]
    [InlineData("", "")]
    [InlineData(null, "")]
    [InlineData("Single", "single")]
    [InlineData("---dashes---", "dashes")]
    [InlineData("Multiple---Dashes", "multiple-dashes")]
    public void Generate_ValidInput_ReturnsExpectedSlug(string input, string expected)
    {
        var result = SlugGenerator.Generate(input);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void Generate_WithAccents_RemovesAccents()
    {
        var result = SlugGenerator.Generate("Café Résumé");
        Assert.Equal("cafe-resume", result);
    }

    [Fact]
    public void Generate_WithUnicode_HandlesGracefully()
    {
        var result = SlugGenerator.Generate("🚀 Rocket 🚀");
        Assert.Equal("rocket", result);
    }
}