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
    public class AnalyticsControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;
        private readonly string _adminToken;

        public AnalyticsControllerTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<BlogDbContext>));
                    if (descriptor != null) services.Remove(descriptor);

                    services.AddDbContext<BlogDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("AnalyticsTestDb");
                    });
                });
            });

            _client = _factory.CreateClient();
            _adminToken = GetAdminTokenAsync().Result;
        }

        private async Task<string> GetAdminTokenAsync()
        {
            // Create admin user and get token
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BlogDbContext>();

            // Seed admin user
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

            // Login to get token
            var loginRequest = new { usernameOrEmail = "admin", password = "Admin@123456" };
            var loginJson = JsonSerializer.Serialize(loginRequest);
            var loginContent = new StringContent(loginJson, Encoding.UTF8, "application/json");

            var loginResponse = await _client.PostAsync("/api/Auth/login", loginContent);
            var loginResult = await loginResponse.Content.ReadAsStringAsync();
            var loginData = JsonSerializer.Deserialize<JsonElement>(loginResult);

            return loginData.GetProperty("token").GetString() ?? "";
        }

        private async Task SeedTestDataAsync()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BlogDbContext>();

            // Create test users
            var bloggerRole = new Role { Name = "Blogger" };
            db.Roles.Add(bloggerRole);
            await db.SaveChangesAsync();

            var user1 = new User
            {
                Email = "user1@test.com",
                Username = "user1",
                PasswordHash = BCryptNet.HashPassword("Password@123"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            };
            var user2 = new User
            {
                Email = "user2@test.com",
                Username = "user2",
                PasswordHash = BCryptNet.HashPassword("Password@123"),
                IsActive = false,
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            };
            db.Users.AddRange(user1, user2);
            await db.SaveChangesAsync();

            db.UserRoles.AddRange(
                new UserRole { UserId = user1.Id, RoleId = bloggerRole.Id },
                new UserRole { UserId = user2.Id, RoleId = bloggerRole.Id }
            );

            // Create test categories
            var category1 = new Category { Name = "Technology", Slug = "technology" };
            var category2 = new Category { Name = "Business", Slug = "business" };
            db.Categories.AddRange(category1, category2);
            await db.SaveChangesAsync();

            // Create test posts
            var posts = new List<Post>
            {
                new Post
                {
                    Title = "Test Post 1",
                    Slug = "test-post-1",
                    ContentHtml = "<p>Test content 1</p>",
                    Status = PostStatus.Published,
                    AuthorId = user1.Id,
                    CategoryId = category1.Id,
                    CreatedAt = DateTime.UtcNow.AddHours(-1),
                    UpdatedAt = DateTime.UtcNow.AddHours(-1)
                },
                new Post
                {
                    Title = "Test Post 2",
                    Slug = "test-post-2",
                    ContentHtml = "<p>Test content 2</p>",
                    Status = PostStatus.Draft,
                    AuthorId = user1.Id,
                    CategoryId = category2.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new Post
                {
                    Title = "Test Post 3",
                    Slug = "test-post-3",
                    ContentHtml = "<p>Test content 3</p>",
                    Status = PostStatus.PendingReview,
                    AuthorId = user2.Id,
                    CategoryId = category1.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    UpdatedAt = DateTime.UtcNow.AddDays(-3)
                }
            };
            db.Posts.AddRange(posts);
            await db.SaveChangesAsync();
        }

        [Fact]
        public async Task GetDashboardMetrics_ReturnsCorrectMetrics()
        {
            // Arrange
            await SeedTestDataAsync();
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);

            // Act
            var response = await _client.GetAsync("/api/Analytics/dashboard");

            // Assert
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(content);

            // Verify posts metrics
            var posts = result.GetProperty("posts");
            Assert.Equal(3, posts.GetProperty("total").GetInt32());
            Assert.Equal(1, posts.GetProperty("published").GetInt32());
            Assert.Equal(1, posts.GetProperty("draft").GetInt32());
            Assert.Equal(1, posts.GetProperty("pendingReview").GetInt32());

            // Verify users metrics
            var users = result.GetProperty("users");
            Assert.Equal(3, users.GetProperty("total").GetInt32()); // 2 test users + 1 admin
            Assert.Equal(2, users.GetProperty("active").GetInt32());
            Assert.Equal(1, users.GetProperty("inactive").GetInt32());

            // Verify categories metrics
            var categories = result.GetProperty("categories");
            Assert.Equal(2, categories.GetProperty("total").GetInt32());
            Assert.Equal(2, categories.GetProperty("withPosts").GetInt32());

            // Verify recent posts
            var recentPosts = result.GetProperty("recentPosts");
            Assert.True(recentPosts.GetArrayLength() > 0);

            // Verify recent users
            var recentUsers = result.GetProperty("recentUsers");
            Assert.True(recentUsers.GetArrayLength() > 0);
        }

        [Fact]
        public async Task GetCategoryStats_ReturnsCorrectStatistics()
        {
            // Arrange
            await SeedTestDataAsync();
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);

            // Act
            var response = await _client.GetAsync("/api/Analytics/category-stats");

            // Assert
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement[]>(content);

            Assert.Equal(2, result.Length);

            // Find Technology category
            var techCategory = result.FirstOrDefault(c => c.GetProperty("categoryName").GetString() == "Technology");
            Assert.NotNull(techCategory);
            Assert.Equal(2, techCategory.GetProperty("totalPosts").GetInt32());
            Assert.Equal(1, techCategory.GetProperty("publishedPosts").GetInt32());
            Assert.Equal(0, techCategory.GetProperty("draftPosts").GetInt32());
            Assert.Equal(1, techCategory.GetProperty("pendingPosts").GetInt32());

            // Find Business category
            var businessCategory = result.FirstOrDefault(c => c.GetProperty("categoryName").GetString() == "Business");
            Assert.NotNull(businessCategory);
            Assert.Equal(1, businessCategory.GetProperty("totalPosts").GetInt32());
            Assert.Equal(0, businessCategory.GetProperty("publishedPosts").GetInt32());
            Assert.Equal(1, businessCategory.GetProperty("draftPosts").GetInt32());
            Assert.Equal(0, businessCategory.GetProperty("pendingPosts").GetInt32());
        }

        [Fact]
        public async Task GetUserActivity_ReturnsCorrectActivity()
        {
            // Arrange
            await SeedTestDataAsync();
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);

            // Act
            var response = await _client.GetAsync("/api/Analytics/user-activity");

            // Assert
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement[]>(content);

            Assert.True(result.Length >= 2);

            // Find user1 (should have 2 posts)
            var user1 = result.FirstOrDefault(u => u.GetProperty("username").GetString() == "user1");
            Assert.NotNull(user1);
            Assert.Equal(2, user1.GetProperty("totalPosts").GetInt32());
            Assert.Equal(1, user1.GetProperty("publishedPosts").GetInt32());
            Assert.True(user1.GetProperty("isActive").GetBoolean());

            // Find user2 (should have 1 post)
            var user2 = result.FirstOrDefault(u => u.GetProperty("username").GetString() == "user2");
            Assert.NotNull(user2);
            Assert.Equal(1, user2.GetProperty("totalPosts").GetInt32());
            Assert.Equal(0, user2.GetProperty("publishedPosts").GetInt32());
            Assert.False(user2.GetProperty("isActive").GetBoolean());
        }

        [Fact]
        public async Task GetRecentUserPosts_ReturnsCorrectData()
        {
            // Arrange
            await SeedTestDataAsync();
            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);

            // Act
            var response = await _client.GetAsync("/api/Analytics/recent-user-posts");

            // Assert
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement[]>(content);

            Assert.True(result.Length >= 1);

            // Find user1 (should have recent posts)
            var user1 = result.FirstOrDefault(u => u.GetProperty("username").GetString() == "user1");
            Assert.NotNull(user1);
            Assert.True(user1.GetProperty("postsLast7Days").GetInt32() > 0);
        }

        [Fact]
        public async Task GetDashboardMetrics_WithoutAdminToken_ReturnsUnauthorized()
        {
            // Act
            var response = await _client.GetAsync("/api/Analytics/dashboard");

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetCategoryStats_WithoutAdminToken_ReturnsUnauthorized()
        {
            // Act
            var response = await _client.GetAsync("/api/Analytics/category-stats");

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetUserActivity_WithoutAdminToken_ReturnsUnauthorized()
        {
            // Act
            var response = await _client.GetAsync("/api/Analytics/user-activity");

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetRecentUserPosts_WithoutAdminToken_ReturnsUnauthorized()
        {
            // Act
            var response = await _client.GetAsync("/api/Analytics/recent-user-posts");

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
