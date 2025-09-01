using System.Net;
using System.Net.Http.Json;
using BlogCms.Api.DTOs;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BlogCms.Tests.Controllers;

public class CategoriesControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public CategoriesControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace SQL Server with in-memory provider
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<BlogCms.Api.Data.BlogDbContext>));
                if (descriptor != null) services.Remove(descriptor);
                services.AddDbContext<BlogCms.Api.Data.BlogDbContext>(o => o.UseInMemoryDatabase("CategoriesTests"));
            });
        });
    }

    [Fact]
    public async Task Get_List_ReturnsOk()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/Categories");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var categories = await response.Content.ReadFromJsonAsync<List<CategoryResponse>>();
        categories.Should().NotBeNull();
    }

    [Fact]
    public async Task Post_Create_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var category = new CategoryCreateRequest
        {
            Name = "Test Category",
            Description = "Test Description"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Categories", category);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Post_Create_WithAuth_ReturnsForbidden()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        // Register and login to get token (this creates a Blogger user, not Admin)
        var registerRequest = new RegisterRequest
        {
            Username = "categorycreator",
            Email = "categorycreator@example.com",
            Password = "Password123!"
        };
        await client.PostAsJsonAsync("/api/Auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "categorycreator",
            Password = "Password123!"
        };
        var loginResponse = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);
        var authResponse = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        var category = new CategoryCreateRequest
        {
            Name = "Test Category",
            Description = "Test Description"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Categories", category);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Put_Update_WithoutAuth_ReturnsNotFound()
    {
        // Arrange
        var client = _factory.CreateClient();
        var category = new CategoryUpdateRequest
        {
            Name = "Updated Category",
            Description = "Updated Description"
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/Categories/1", category);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Delete_WithoutAuth_ReturnsNotFound()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.DeleteAsync("/api/Categories/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Get_ById_NonExistentCategory_ReturnsNotFound()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/Categories/999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
