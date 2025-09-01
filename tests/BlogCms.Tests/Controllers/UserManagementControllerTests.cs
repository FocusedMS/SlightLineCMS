using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Xunit;
using BlogCms.Api.Data;
using BlogCms.Api.Domain.Entities;
using BCryptNet = BCrypt.Net.BCrypt;

namespace BlogCms.Tests.Controllers
{
    public class UserManagementControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;
        private readonly string _adminToken;
        private readonly string _bloggerToken;

        public UserManagementControllerTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<BlogDbContext>));
                    if (descriptor != null) services.Remove(descriptor);

                    services.AddDbContext<BlogDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("UserManagementTestDb");
                    });
                });
            });

            _client = _factory.CreateClient();
            _adminToken = GetAdminTokenAsync().Result;
            _bloggerToken = GetBloggerTokenAsync().Result;
        }

        private async Task<string> GetAdminTokenAsync()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BlogDbContext>();

            var adminRole = new Role { Name = "Admin" };
            db.Roles.Add(adminRole);
            await db.SaveChangesAsync();

            var admin = new User
            {
                Email = "admin@test.com",
                Username = "admin",
                PasswordHash = BCryptNet.HashPassword("Admin@123456"),
                IsActive = true
            };
            db.Users.Add(admin);
            await db.SaveChangesAsync();

            db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = adminRole.Id });
            await db.SaveChangesAsync();

            var loginRequest = new { usernameOrEmail = "admin", password = "Admin@123456" };
            var loginJson = JsonSerializer.Serialize(loginRequest);
            var loginContent = new StringContent(loginJson, Encoding.UTF8, "application/json");

            var loginResponse = await _client.PostAsync("/api/Auth/login", loginContent);
            var loginResult = await loginResponse.Content.ReadAsStringAsync();
            var loginData = JsonSerializer.Deserialize<JsonElement>(loginResult);

            return loginData.GetProperty("token").GetString() ?? "";
        }

        private async Task<string> GetBloggerTokenAsync()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BlogDbContext>();

            var bloggerRole = new Role { Name = "Blogger" };
            db.Roles.Add(bloggerRole);
            await db.SaveChangesAsync();

            var blogger = new User
            {
                Email = "blogger@test.com",
                Username = "blogger",
                PasswordHash = BCryptNet.HashPassword("Password@123"),
                IsActive = true
            };
            db.Users.Add(blogger);
            await db.SaveChangesAsync();

            db.UserRoles.Add(new UserRole { UserId = blogger.Id, RoleId = bloggerRole.Id });
            await db.SaveChangesAsync();

            var loginRequest = new { usernameOrEmail = "blogger", password = "Password@123" };
            var loginJson = JsonSerializer.Serialize(loginRequest);
            var loginContent = new StringContent(loginJson, Encoding.UTF8, "application/json");

            var loginResponse = await _client.PostAsync("/api/Auth/login", loginContent);
            var loginResult = await loginResponse.Content.ReadAsStringAsync();
            var loginData = JsonSerializer.Deserialize<JsonElement>(loginResult);

            return loginData.GetProperty("token").GetString() ?? "";
        }

        private async Task<int> CreateTestUserAsync()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BlogDbContext>();

            var bloggerRole = await db.Roles.FirstAsync(r => r.Name == "Blogger");

            var testUser = new User
            {
                Email = "testuser@test.com",
                Username = "testuser",
                PasswordHash = BCryptNet.HashPassword("Password@123"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };
            db.Users.Add(testUser);
            await db.SaveChangesAsync();

            db.UserRoles.Add(new UserRole { UserId = testUser.Id, RoleId = bloggerRole.Id });
            await db.SaveChangesAsync();

            return testUser.Id;
        }

        [Fact]
        public async Task GetUsers_AsAdmin_ReturnsAllUsers()
        {
            // Arrange
            var testUserId = await CreateTestUserAsync();
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);

            // Act
            var response = await _client.GetAsync("/api/UserManagement/users");

            // Assert
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement[]>(content);

            Assert.True(result.Length >= 2); // At least admin and test user

            var testUser = result.FirstOrDefault(u => u.GetProperty("username").GetString() == "testuser");
            Assert.NotNull(testUser);
            Assert.Equal("testuser@test.com", testUser.GetProperty("email").GetString());
            Assert.Equal("Blogger", testUser.GetProperty("role").GetString());
            Assert.True(testUser.GetProperty("isActive").GetBoolean());
        }

        [Fact]
        public async Task GetUsers_AsBlogger_ReturnsUnauthorized()
        {
            // Arrange
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _bloggerToken);

            // Act
            var response = await _client.GetAsync("/api/UserManagement/users");

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetUsers_WithoutToken_ReturnsUnauthorized()
        {
            // Act
            var response = await _client.GetAsync("/api/UserManagement/users");

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task ToggleUserStatus_AsAdmin_UpdatesUserStatus()
        {
            // Arrange
            var testUserId = await CreateTestUserAsync();
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);

            var toggleRequest = new { isActive = false };
            var toggleJson = JsonSerializer.Serialize(toggleRequest);
            var toggleContent = new StringContent(toggleJson, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PutAsync($"/api/UserManagement/users/{testUserId}/toggle-status", toggleContent);

            // Assert
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(content);
            Assert.Contains("locked", result.GetProperty("message").GetString());

            // Verify the user is actually locked
            var getUsersResponse = await _client.GetAsync("/api/UserManagement/users");
            var usersContent = await getUsersResponse.Content.ReadAsStringAsync();
            var users = JsonSerializer.Deserialize<JsonElement[]>(usersContent);
            var updatedUser = users.FirstOrDefault(u => u.GetProperty("id").GetInt32() == testUserId);
            Assert.NotNull(updatedUser);
            Assert.False(updatedUser.GetProperty("isActive").GetBoolean());
        }

        [Fact]
        public async Task ToggleUserStatus_AsBlogger_ReturnsUnauthorized()
        {
            // Arrange
            var testUserId = await CreateTestUserAsync();
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _bloggerToken);

            var toggleRequest = new { isActive = false };
            var toggleJson = JsonSerializer.Serialize(toggleRequest);
            var toggleContent = new StringContent(toggleJson, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PutAsync($"/api/UserManagement/users/{testUserId}/toggle-status", toggleContent);

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task ToggleUserStatus_NonExistentUser_ReturnsNotFound()
        {
            // Arrange
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);

            var toggleRequest = new { isActive = false };
            var toggleJson = JsonSerializer.Serialize(toggleRequest);
            var toggleContent = new StringContent(toggleJson, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PutAsync("/api/UserManagement/users/99999/toggle-status", toggleContent);

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetUserDetail_AsAdmin_ReturnsUserDetails()
        {
            // Arrange
            var testUserId = await CreateTestUserAsync();
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);

            // Act
            var response = await _client.GetAsync($"/api/UserManagement/users/{testUserId}");

            // Assert
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(content);

            Assert.Equal(testUserId, result.GetProperty("id").GetInt32());
            Assert.Equal("testuser", result.GetProperty("username").GetString());
            Assert.Equal("testuser@test.com", result.GetProperty("email").GetString());
            Assert.Equal("Blogger", result.GetProperty("role").GetString());
            Assert.True(result.GetProperty("isActive").GetBoolean());
            Assert.Equal(0, result.GetProperty("totalPosts").GetInt32());
        }

        [Fact]
        public async Task GetUserDetail_NonExistentUser_ReturnsNotFound()
        {
            // Arrange
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);

            // Act
            var response = await _client.GetAsync("/api/UserManagement/users/99999");

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task DeleteUser_AsAdmin_DeactivatesUser()
        {
            // Arrange
            var testUserId = await CreateTestUserAsync();
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);

            // Act
            var response = await _client.DeleteAsync($"/api/UserManagement/users/{testUserId}");

            // Assert
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(content);
            Assert.Contains("deactivated", result.GetProperty("message").GetString());

            // Verify the user is actually deactivated
            var getUsersResponse = await _client.GetAsync("/api/UserManagement/users");
            var usersContent = await getUsersResponse.Content.ReadAsStringAsync();
            var users = JsonSerializer.Deserialize<JsonElement[]>(usersContent);
            var updatedUser = users.FirstOrDefault(u => u.GetProperty("id").GetInt32() == testUserId);
            Assert.NotNull(updatedUser);
            Assert.False(updatedUser.GetProperty("isActive").GetBoolean());
        }

        [Fact]
        public async Task DeleteUser_AsBlogger_ReturnsUnauthorized()
        {
            // Arrange
            var testUserId = await CreateTestUserAsync();
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _bloggerToken);

            // Act
            var response = await _client.DeleteAsync($"/api/UserManagement/users/{testUserId}");

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task DeleteUser_NonExistentUser_ReturnsNotFound()
        {
            // Arrange
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);

            // Act
            var response = await _client.DeleteAsync("/api/UserManagement/users/99999");

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
