using System.Net;
using System.Net.Http.Json;
using BlogCms.Api.DTOs;
using BlogCms.Api.Domain.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BlogCms.Tests.Controllers;

public class AuthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AuthControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace SQL Server with in-memory provider
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<BlogCms.Api.Data.BlogDbContext>));
                if (descriptor != null) services.Remove(descriptor);
                services.AddDbContext<BlogCms.Api.Data.BlogDbContext>(o => o.UseInMemoryDatabase("AuthTests"));
            });
        });
    }

    [Fact]
    public async Task Register_ValidUser_ReturnsOk()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new RegisterRequest
        {
            Username = "newuser",
            Email = "newuser@example.com",
            Password = "Password123!"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<RegisterResponse>();
        result.Should().NotBeNull();
        result!.Message.Should().Be("Registered");
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsBadRequest()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new RegisterRequest
        {
            Username = "user1",
            Email = "duplicate@example.com",
            Password = "Password123!"
        };

        // Register first user
        await client.PostAsJsonAsync("/api/Auth/register", request);

        // Try to register second user with same email
        var duplicateRequest = new RegisterRequest
        {
            Username = "user2",
            Email = "duplicate@example.com",
            Password = "Password123!"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Auth/register", duplicateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("already in use");
    }

    [Fact]
    public async Task Register_DuplicateUsername_ReturnsBadRequest()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new RegisterRequest
        {
            Username = "duplicateuser",
            Email = "user1@example.com",
            Password = "Password123!"
        };

        // Register first user
        await client.PostAsJsonAsync("/api/Auth/register", request);

        // Try to register second user with same username
        var duplicateRequest = new RegisterRequest
        {
            Username = "duplicateuser",
            Email = "user2@example.com",
            Password = "Password123!"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Auth/register", duplicateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("already in use");
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        // Arrange
        var client = _factory.CreateClient();
        var registerRequest = new RegisterRequest
        {
            Username = "logintestuser",
            Email = "logintest@example.com",
            Password = "Password123!"
        };

        // Register user first
        await client.PostAsJsonAsync("/api/Auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "logintestuser",
            Password = "Password123!"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>();
        authResponse.Should().NotBeNull();
        authResponse!.Token.Should().NotBeNullOrEmpty();
        authResponse.ExpiresIn.Should().BeGreaterThan(0);
        authResponse.User.Should().NotBeNull();
    }

    [Fact]
    public async Task Login_WithEmail_ReturnsToken()
    {
        // Arrange
        var client = _factory.CreateClient();
        var registerRequest = new RegisterRequest
        {
            Username = "emailuser",
            Email = "emailtest@example.com",
            Password = "Password123!"
        };

        // Register user first
        await client.PostAsJsonAsync("/api/Auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "emailtest@example.com",
            Password = "Password123!"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>();
        authResponse.Should().NotBeNull();
        authResponse!.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_InvalidPassword_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var registerRequest = new RegisterRequest
        {
            Username = "wrongpassuser",
            Email = "wrongpass@example.com",
            Password = "Password123!"
        };

        // Register user first
        await client.PostAsJsonAsync("/api/Auth/register", registerRequest);

        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "wrongpassuser",
            Password = "WrongPassword123!"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_NonExistentUser_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "nonexistentuser",
            Password = "Password123!"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Register_UserGetsBloggerRole()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new RegisterRequest
        {
            Username = "roleuser",
            Email = "roleuser@example.com",
            Password = "Password123!"
        };

        // Act
        await client.PostAsJsonAsync("/api/Auth/register", request);

        // Login to verify role
        var loginRequest = new LoginRequest
        {
            UsernameOrEmail = "roleuser",
            Password = "Password123!"
        };

        var loginResponse = await client.PostAsJsonAsync("/api/Auth/login", loginRequest);

        // Assert
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var authResponse = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        authResponse.Should().NotBeNull();
        authResponse!.User.Should().NotBeNull();
        // The role should be "Blogger" for newly registered users
    }
}
