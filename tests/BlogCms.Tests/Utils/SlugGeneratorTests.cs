using FluentAssertions;
using Xunit;

namespace BlogCms.Tests.Utils;

public class SlugGeneratorTests
{
    [Fact]
    public void Generate_ValidInput_ReturnsExpectedSlug()
    {
        // Arrange
        var title = "This is a Test Title";

        // Act
        var slug = SlugGenerator.Generate(title);

        // Assert
        slug.Should().Be("this-is-a-test-title");
    }

    [Fact]
    public void Generate_WithAccents_RemovesAccents()
    {
        // Arrange
        var title = "Café & Résumé";

        // Act
        var slug = SlugGenerator.Generate(title);

        // Assert
        slug.Should().Be("cafe-resume");
    }

    [Fact]
    public void Generate_WithUnicode_HandlesGracefully()
    {
        // Arrange
        var title = "Hello 世界 🌍";

        // Act
        var slug = SlugGenerator.Generate(title);

        // Assert
        slug.Should().NotBeNullOrEmpty();
        slug.Should().NotContain("世界");
        slug.Should().NotContain("🌍");
    }

    [Fact]
    public void Generate_WithSpecialCharacters_RemovesSpecialChars()
    {
        // Arrange
        var title = "Title with @#$%^&*() special characters!";

        // Act
        var slug = SlugGenerator.Generate(title);

        // Assert
        slug.Should().Be("title-with-special-characters");
    }

    [Fact]
    public void Generate_WithMultipleSpaces_ReplacesWithHyphens()
    {
        // Arrange
        var title = "Title   with   multiple   spaces";

        // Act
        var slug = SlugGenerator.Generate(title);

        // Assert
        slug.Should().Be("title-with-multiple-spaces");
    }

    [Fact]
    public void Generate_WithLeadingTrailingSpaces_TrimsSpaces()
    {
        // Arrange
        var title = "  Title with spaces  ";

        // Act
        var slug = SlugGenerator.Generate(title);

        // Assert
        slug.Should().Be("title-with-spaces");
    }

    [Fact]
    public void Generate_EmptyString_ReturnsEmptyString()
    {
        // Arrange
        var title = "";

        // Act
        var slug = SlugGenerator.Generate(title);

        // Assert
        slug.Should().Be("");
    }

    [Fact]
    public void Generate_NullString_ReturnsEmptyString()
    {
        // Arrange
        string? title = null;

        // Act
        var slug = SlugGenerator.Generate(title);

        // Assert
        slug.Should().Be("");
    }

    [Fact]
    public void Generate_WithNumbers_PreservesNumbers()
    {
        // Arrange
        var title = "Title 123 with numbers 456";

        // Act
        var slug = SlugGenerator.Generate(title);

        // Assert
        slug.Should().Be("title-123-with-numbers-456");
    }

    [Fact]
    public void Generate_WithHyphens_PreservesHyphens()
    {
        // Arrange
        var title = "Title-with-hyphens";

        // Act
        var slug = SlugGenerator.Generate(title);

        // Assert
        slug.Should().Be("title-with-hyphens");
    }

    [Fact]
    public void Generate_WithUnderscores_ReplacesWithHyphens()
    {
        // Arrange
        var title = "Title_with_underscores";

        // Act
        var slug = SlugGenerator.Generate(title);

        // Assert
        slug.Should().Be("title-with-underscores");
    }
}

// Utility class for generating slugs
public static class SlugGenerator
{
    public static string Generate(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return "";

        // Convert to lowercase
        var slug = input.ToLowerInvariant();

        // Remove diacritics (accents)
        slug = RemoveDiacritics(slug);

        // Replace special characters with spaces
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", " ");

        // Replace multiple spaces with single hyphen
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-");

        // Replace underscores with hyphens
        slug = slug.Replace("_", "-");

        // Remove leading and trailing hyphens
        slug = slug.Trim('-');

        return slug;
    }

    private static string RemoveDiacritics(string text)
    {
        var normalizedString = text.Normalize(System.Text.NormalizationForm.FormD);
        var stringBuilder = new System.Text.StringBuilder();

        foreach (char c in normalizedString)
        {
            var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        return stringBuilder.ToString().Normalize(System.Text.NormalizationForm.FormC);
    }
}
