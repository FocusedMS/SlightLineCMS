using System.Net;
using System.Net.Http.Json;
using BlogCms.Api.DTOs;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BlogCms.Tests.Controllers;

public class SeoControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public SeoControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace SQL Server with in-memory provider
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<BlogCms.Api.Data.BlogDbContext>));
                if (descriptor != null) services.Remove(descriptor);
                services.AddDbContext<BlogCms.Api.Data.BlogDbContext>(o => o.UseInMemoryDatabase("SeoTests"));
            });
        });
    }

    private async Task<string> GetAuthTokenAsync(HttpClient client)
    {
        // Register a test user first
        var registerRequest = new RegisterRequest
        {
            Email = "test@example.com",
            Username = "testuser",
            Password = "TestPass123!"
        };
        await client.PostAsJsonAsync("/api/Auth/register", registerRequest);

        // Login to get token
        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "testuser",
            Password = "TestPass123!"
        };
        var loginResponse = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);
        var authResponse = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        return authResponse!.Token;
    }

    [Fact]
    public async Task Post_Analyze_ValidContent_ReturnsOk()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = await GetAuthTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        
        var request = new SeoAnalysisRequest
        {
            Title = "This is a perfect title with exactly 50 characters",
            Excerpt = "This is a perfect meta description with exactly 120 characters to meet SEO requirements.",
            ContentHtml = "<h1>Main Title</h1><p>This is the first paragraph with focus keyword.</p><p>More content here.</p>",
            FocusKeyword = "focus keyword",
            Slug = "focus-keyword-slug"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Seo/analyze", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<SeoAnalysisResponse>();
        result.Should().NotBeNull();
        result!.Score.Should().BeGreaterThan(0);
        result.Suggestions.Should().NotBeNull();
    }

    [Fact]
    public async Task Post_Analyze_ShortTitle_ReturnsLowerScore()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = await GetAuthTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        
        var request = new SeoAnalysisRequest
        {
            Title = "Short",
            ContentHtml = "<h1>Title</h1><p>Content</p>"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Seo/analyze", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<SeoAnalysisResponse>();
        result.Should().NotBeNull();
        result!.Score.Should().BeLessThan(100);
        result.Suggestions.Should().Contain(s => s.Type == "title");
    }

    [Fact]
    public async Task Post_Analyze_NoH1_ReturnsLowerScore()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = await GetAuthTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        
        var request = new SeoAnalysisRequest
        {
            Title = "Good Title",
            ContentHtml = "<h2>Subtitle</h2><p>Content</p>"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Seo/analyze", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<SeoAnalysisResponse>();
        result.Should().NotBeNull();
        result!.Score.Should().BeLessThan(100);
        result.Suggestions.Should().Contain(s => s.Type == "headings");
    }

    [Fact]
    public async Task Post_Analyze_WithFocusKeyword_ReturnsKeywordSuggestions()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = await GetAuthTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        
        var request = new SeoAnalysisRequest
        {
            Title = "Different Title",
            ContentHtml = "<h1>Title</h1><p>Content with focus keyword.</p>",
            FocusKeyword = "focus keyword"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Seo/analyze", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<SeoAnalysisResponse>();
        result.Should().NotBeNull();
        result!.Suggestions.Should().Contain(s => s.Type == "keyword");
    }

    [Fact]
    public async Task Post_Analyze_ImagesWithoutAlt_ReturnsImageSuggestions()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = await GetAuthTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        
        var request = new SeoAnalysisRequest
        {
            Title = "Good Title",
            ContentHtml = "<h1>Title</h1><p>Content with <img src=\"image.jpg\"> image.</p>"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Seo/analyze", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<SeoAnalysisResponse>();
        result.Should().NotBeNull();
        result!.Suggestions.Should().Contain(s => s.Type == "images");
    }

    [Fact]
    public async Task Post_Analyze_ShortContent_ReturnsLengthSuggestion()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = await GetAuthTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        
        var request = new SeoAnalysisRequest
        {
            Title = "Good Title",
            ContentHtml = "<h1>Title</h1><p>Short content.</p>"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Seo/analyze", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<SeoAnalysisResponse>();
        result.Should().NotBeNull();
        result!.Suggestions.Should().Contain(s => s.Type == "length");
    }

    [Fact]
    public async Task Post_Analyze_ScoreNeverBelowZero()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = await GetAuthTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        
        var request = new SeoAnalysisRequest
        {
            Title = "",
            ContentHtml = ""
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Seo/analyze", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<SeoAnalysisResponse>();
        result.Should().NotBeNull();
        result!.Score.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public async Task Post_Analyze_ScoreNeverAboveHundred()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = await GetAuthTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        
        var request = new SeoAnalysisRequest
        {
            Title = "Perfect title with exactly 50 characters",
            Excerpt = "Perfect meta description with exactly 120 characters to meet SEO requirements.",
            ContentHtml = "<h1>Title</h1><p>Content with <a href=\"/internal\">internal link</a> and <a href=\"https://external.com\">external link</a>. <img src=\"image.jpg\" alt=\"Description\"> Image.</p>"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Seo/analyze", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<SeoAnalysisResponse>();
        result.Should().NotBeNull();
        result!.Score.Should().BeLessThanOrEqualTo(100);
    }
}
