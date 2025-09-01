using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using BlogCms.Api.DTOs;
using BlogCms.Api.Domain.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BlogCms.Tests.Controllers;

public class PostsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public PostsControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace SQL Server with in-memory provider
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<BlogCms.Api.Data.BlogDbContext>));
                if (descriptor != null) services.Remove(descriptor);
                services.AddDbContext<BlogCms.Api.Data.BlogDbContext>(o => o.UseInMemoryDatabase("PostsTests"));
            });
        });
    }

    [Fact]
    public async Task Get_List_ReturnsOkAndPagedResult()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/Posts");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<PostResponse>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull();
    }

    [Fact]
    public async Task Get_List_WithPagination_ReturnsCorrectPage()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/Posts?page=1&pageSize=5");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<PostResponse>>();
        result.Should().NotBeNull();
        result!.Page.Should().Be(1);
        result.PageSize.Should().Be(5);
    }

    [Fact]
    public async Task Get_List_WithSearch_ReturnsFilteredResults()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/Posts?search=test");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<PostResponse>>();
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task Get_BySlug_NonExistentPost_ReturnsNotFound()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/Posts/non-existent-slug");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Post_Create_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var post = new PostCreateRequest
        {
            Title = "Test Post",
            ContentHtml = "<p>Test content</p>"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Posts", post);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Post_Create_WithAuth_ReturnsCreated()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        // Register and login to get token
        var registerRequest = new RegisterRequest
        {
            Username = "postcreator",
            Email = "postcreator@example.com",
            Password = "Password123!"
        };
        await client.PostAsJsonAsync("/api/Auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "postcreator",
            Password = "Password123!"
        };
        var loginResponse = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);
        var authResponse = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

        // Set authorization header
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        var post = new PostCreateRequest
        {
            Title = "Test Post",
            ContentHtml = "<p>Test content</p>"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Posts", post);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdPost = await response.Content.ReadFromJsonAsync<PostResponse>();
        createdPost.Should().NotBeNull();
        createdPost!.Title.Should().Be("Test Post");
    }

    [Fact]
    public async Task Put_Update_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var post = new PostUpdateRequest
        {
            Title = "Updated Post",
            ContentHtml = "<p>Updated content</p>"
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/Posts/1", post);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Delete_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.DeleteAsync("/api/Posts/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_List_ReturnsETag()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Create a test post first to ensure we have data
        var registerRequest = new RegisterRequest
        {
            Username = "etaguser",
            Email = "etaguser@example.com",
            Password = "Password123!"
        };
        await client.PostAsJsonAsync("/api/Auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "etaguser",
            Password = "Password123!"
        };
        var loginResponse = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);
        var authResponse = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        var post = new PostCreateRequest
        {
            Title = "Test Post for ETag",
            ContentHtml = "<p>Test content</p>"
        };
        var createResponse = await client.PostAsJsonAsync("/api/Posts", post);
        var createdPost = await createResponse.Content.ReadFromJsonAsync<PostResponse>();

        // Submit for review
        await client.PostAsync($"/api/Posts/{createdPost!.Id}/submit", null);

        // Approve the post (requires admin role)
        var adminLoginRequest = new LoginRequest
        {
            UsernameOrEmail = "admin",
            Password = "Admin@123"
        };
        var adminLoginResponse = await client.PostAsJsonAsync("/api/Auth/login", adminLoginRequest);
        var adminAuthResponse = await adminLoginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", adminAuthResponse!.Token);
        await client.PostAsync($"/api/Moderation/posts/{createdPost.Id}/approve", null);

        // Remove auth header for public access
        client.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await client.GetAsync("/api/Posts");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.ETag.Should().NotBeNull();
    }

    [Fact]
    public async Task Get_List_WithIfNoneMatch_ReturnsNotModified()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        // Create a test post first to ensure we have data
        var registerRequest = new RegisterRequest
        {
            Username = "ifnonematchuser",
            Email = "ifnonematchuser@example.com",
            Password = "Password123!"
        };
        await client.PostAsJsonAsync("/api/Auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "ifnonematchuser",
            Password = "Password123!"
        };
        var loginResponse = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);
        var authResponse = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        var post = new PostCreateRequest
        {
            Title = "Test Post for If-None-Match",
            ContentHtml = "<p>Test content</p>"
        };
        var createResponse = await client.PostAsJsonAsync("/api/Posts", post);
        var createdPost = await createResponse.Content.ReadFromJsonAsync<PostResponse>();

        // Submit for review
        await client.PostAsync($"/api/Posts/{createdPost!.Id}/submit", null);

        // Approve the post (requires admin role)
        var adminLoginRequest = new LoginRequest
        {
            UsernameOrEmail = "admin",
            Password = "Admin@123"
        };
        var adminLoginResponse = await client.PostAsJsonAsync("/api/Auth/login", adminLoginRequest);
        var adminAuthResponse = await adminLoginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", adminAuthResponse!.Token);
        await client.PostAsync($"/api/Moderation/posts/{createdPost.Id}/approve", null);

        // Remove auth header for public access
        client.DefaultRequestHeaders.Authorization = null;
        
        // Get initial response to obtain ETag
        var initialResponse = await client.GetAsync("/api/Posts");
        var etag = initialResponse.Headers.ETag?.Tag;

        // Create request with If-None-Match header
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/Posts");
        if (etag != null)
        {
            request.Headers.TryAddWithoutValidation("If-None-Match", etag);
        }

        // Act
        var response = await client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotModified);
    }

    [Fact]
    public async Task Get_BySlug_ReturnsETag()
    {
        // Arrange
        var client = _factory.CreateClient();

        // First create a post to get a valid slug
        var registerRequest = new RegisterRequest
        {
            Username = "sluguser",
            Email = "sluguser@example.com",
            Password = "Password123!"
        };
        await client.PostAsJsonAsync("/api/Auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "sluguser",
            Password = "Password123!"
        };
        var loginResponse = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);
        var authResponse = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        var post = new PostCreateRequest
        {
            Title = "Test Post for Slug",
            ContentHtml = "<p>Test content</p>"
        };
        var createResponse = await client.PostAsJsonAsync("/api/Posts", post);
        var createdPost = await createResponse.Content.ReadFromJsonAsync<PostResponse>();

        // Submit for review
        await client.PostAsync($"/api/Posts/{createdPost!.Id}/submit", null);

        // Approve the post (requires admin role)
        var adminLoginRequest = new LoginRequest
        {
            UsernameOrEmail = "admin",
            Password = "Admin@123"
        };
        var adminLoginResponse = await client.PostAsJsonAsync("/api/Auth/login", adminLoginRequest);
        var adminAuthResponse = await adminLoginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", adminAuthResponse!.Token);
        await client.PostAsync($"/api/Moderation/posts/{createdPost.Id}/approve", null);

        // Remove auth header for public access
        client.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await client.GetAsync($"/api/Posts/{createdPost!.Slug}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.ETag.Should().NotBeNull();
    }

    [Fact]
    public async Task Post_Create_WithInvalidData_ReturnsBadRequest()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        // Register and login to get token
        var registerRequest = new RegisterRequest
        {
            Username = "invaliduser",
            Email = "invaliduser@example.com",
            Password = "Password123!"
        };
        await client.PostAsJsonAsync("/api/Auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "invaliduser",
            Password = "Password123!"
        };
        var loginResponse = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);
        var authResponse = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        var post = new PostCreateRequest
        {
            Title = "", // Invalid: empty title
            ContentHtml = "<p>Test content</p>"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Posts", post);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
