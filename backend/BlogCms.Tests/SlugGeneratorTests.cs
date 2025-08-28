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
    [InlineData("  Spaces   in   title  ", "spaces-in-title")]
    [InlineData("C# & .NET", "c-net")]
    [InlineData("!!!", "")] // fallback to empty slug
    public void Generate_ReturnsExpectedSlug(string input, string expected)
    {
        var slug = SlugGenerator.Generate(input);
        Assert.Equal(expected, slug);
    }
}