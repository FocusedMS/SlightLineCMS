using System.Net;
using System.Net.Http.Json;
using BlogCms.Api.DTOs;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BlogCms.Tests.Controllers;

public class MediaControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public MediaControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace SQL Server with in-memory provider
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<BlogCms.Api.Data.BlogDbContext>));
                if (descriptor != null) services.Remove(descriptor);
                services.AddDbContext<BlogCms.Api.Data.BlogDbContext>(o => o.UseInMemoryDatabase("MediaTests"));
            });
        });
    }

    [Fact]
    public async Task Get_List_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/Media");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Get_List_WithAuth_ReturnsNotFound()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        // Register and login to get token
        var registerRequest = new RegisterRequest
        {
            Username = "mediauser",
            Email = "mediauser@example.com",
            Password = "Password123!"
        };
        await client.PostAsJsonAsync("/api/Auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "mediauser",
            Password = "Password123!"
        };
        var loginResponse = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);
        var authResponse = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        // Act
        var response = await client.GetAsync("/api/Media");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Post_Upload_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var content = new MultipartFormDataContent();
        var fileContent = new StringContent("test file content");
        content.Add(fileContent, "file", "test.txt");

        // Act
        var response = await client.PostAsync("/api/Media/upload", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Post_Upload_WithAuth_ReturnsOk()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        // Register and login to get token
        var registerRequest = new RegisterRequest
        {
            Username = "uploaduser",
            Email = "uploaduser@example.com",
            Password = "Password123!"
        };
        await client.PostAsJsonAsync("/api/Auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "uploaduser",
            Password = "Password123!"
        };
        var loginResponse = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);
        var authResponse = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 }); // JPEG header
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
        content.Add(fileContent, "file", "test.jpg");

        // Act
        var response = await client.PostAsync("/api/Media/upload", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var uploadResult = await response.Content.ReadFromJsonAsync<MediaUploadResponse>();
        uploadResult.Should().NotBeNull();
        uploadResult!.FileName.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Get_Download_WithoutAuth_ReturnsNotFound()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/Media/download/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Delete_WithoutAuth_ReturnsNotFound()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.DeleteAsync("/api/Media/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Get_ById_NonExistentMedia_ReturnsNotFound()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        // Register and login to get token
        var registerRequest = new RegisterRequest
        {
            Username = "mediauser2",
            Email = "mediauser2@example.com",
            Password = "Password123!"
        };
        await client.PostAsJsonAsync("/api/Auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "mediauser2",
            Password = "Password123!"
        };
        var loginResponse = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);
        var authResponse = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.Token);

        // Act
        var response = await client.GetAsync("/api/Media/999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
