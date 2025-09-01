using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BlogCms.Api.Data;
using BlogCms.Api.DTOs;
using BlogCms.Api.Domain.Entities;

namespace BlogCms.Api.Controllers
{
    /// <summary>
    /// Analytics and metrics endpoints for admin dashboard
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AnalyticsController : ControllerBase
    {
        private readonly BlogDbContext db;

        public AnalyticsController(BlogDbContext db)
        {
            this.db = db;
        }

        /// <summary>
        /// Get comprehensive dashboard metrics for admin
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<ActionResult<DashboardMetrics>> GetDashboardMetrics()
        {
            var now = DateTime.UtcNow;
            var last24Hours = now.AddHours(-24);
            var last7Days = now.AddDays(-7);
            var last30Days = now.AddDays(-30);

            // Posts metrics
            var totalPosts = await db.Posts.CountAsync();
            var postsLast24Hours = await db.Posts.CountAsync(p => p.CreatedAt >= last24Hours);
            var postsLast7Days = await db.Posts.CountAsync(p => p.CreatedAt >= last7Days);
            var postsLast30Days = await db.Posts.CountAsync(p => p.CreatedAt >= last30Days);

            // Users metrics
            var totalUsers = await db.Users.CountAsync();
            var usersLast24Hours = await db.Users.CountAsync(u => u.CreatedAt >= last24Hours);
            var usersLast7Days = await db.Users.CountAsync(u => u.CreatedAt >= last7Days);
            var usersLast30Days = await db.Users.CountAsync(u => u.CreatedAt >= last30Days);
            var activeUsers = await db.Users.CountAsync(u => u.IsActive);
            var inactiveUsers = await db.Users.CountAsync(u => !u.IsActive);

            // Categories metrics
            var totalCategories = await db.Categories.CountAsync();
            var categoriesWithPosts = await db.Categories
                .CountAsync(c => c.Posts.Any());

            // Posts by status
            var publishedPosts = await db.Posts.CountAsync(p => p.Status == PostStatus.Published);
            var draftPosts = await db.Posts.CountAsync(p => p.Status == PostStatus.Draft);
            var pendingPosts = await db.Posts.CountAsync(p => p.Status == PostStatus.PendingReview);

            // Recent activity
            var recentPosts = await db.Posts
                .Include(p => p.Author)
                .Include(p => p.Category)
                .OrderByDescending(p => p.CreatedAt)
                .Take(5)
                .Select(p => new RecentPostDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Author = p.Author.Username,
                    Category = p.Category != null ? p.Category.Name : "Uncategorized",
                    Status = p.Status.ToString(),
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            var recentUsers = await db.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .OrderByDescending(u => u.CreatedAt)
                .Take(5)
                .Select(u => new RecentUserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "Blogger",
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return new DashboardMetrics
            {
                Posts = new PostMetrics
                {
                    Total = totalPosts,
                    Last24Hours = postsLast24Hours,
                    Last7Days = postsLast7Days,
                    Last30Days = postsLast30Days,
                    Published = publishedPosts,
                    Draft = draftPosts,
                    PendingReview = pendingPosts
                },
                Users = new UserMetrics
                {
                    Total = totalUsers,
                    Last24Hours = usersLast24Hours,
                    Last7Days = usersLast7Days,
                    Last30Days = usersLast30Days,
                    Active = activeUsers,
                    Inactive = inactiveUsers
                },
                Categories = new CategoryMetrics
                {
                    Total = totalCategories,
                    WithPosts = categoriesWithPosts
                },
                RecentPosts = recentPosts,
                RecentUsers = recentUsers
            };
        }

        /// <summary>
        /// Get category-wise post statistics
        /// </summary>
        [HttpGet("category-stats")]
        public async Task<ActionResult<List<CategoryStatsDto>>> GetCategoryStats()
        {
            var stats = await db.Categories
                .Select(c => new CategoryStatsDto
                {
                    CategoryId = c.Id,
                    CategoryName = c.Name,
                    TotalPosts = db.Posts.Count(p => p.CategoryId == c.Id),
                    PublishedPosts = db.Posts.Count(p => p.CategoryId == c.Id && p.Status == PostStatus.Published),
                    DraftPosts = db.Posts.Count(p => p.CategoryId == c.Id && p.Status == PostStatus.Draft),
                    PendingPosts = db.Posts.Count(p => p.CategoryId == c.Id && p.Status == PostStatus.PendingReview),
                    LastPostDate = db.Posts.Where(p => p.CategoryId == c.Id).OrderByDescending(p => p.CreatedAt).Select(p => p.CreatedAt).FirstOrDefault()
                })
                .OrderByDescending(c => c.TotalPosts)
                .ToListAsync();

            return stats;
        }

        /// <summary>
        /// Get user activity statistics
        /// </summary>
        [HttpGet("user-activity")]
        public async Task<ActionResult<List<UserActivityDto>>> GetUserActivity()
        {
            var activity = await db.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Select(u => new UserActivityDto
                {
                    UserId = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "Blogger",
                    IsActive = u.IsActive,
                    TotalPosts = db.Posts.Count(p => p.AuthorId == u.Id),
                    PublishedPosts = db.Posts.Count(p => p.AuthorId == u.Id && p.Status == PostStatus.Published),
                    LastPostDate = db.Posts.Where(p => p.AuthorId == u.Id).OrderByDescending(p => p.CreatedAt).Select(p => p.CreatedAt).FirstOrDefault(),
                    CreatedAt = u.CreatedAt
                })
                .OrderByDescending(u => u.TotalPosts)
                .ToListAsync();

            return activity;
        }

        /// <summary>
        /// Get posts created by users in the last 7 days
        /// </summary>
        [HttpGet("recent-user-posts")]
        public async Task<ActionResult<List<UserPostActivityDto>>> GetRecentUserPosts()
        {
            var last7Days = DateTime.UtcNow.AddDays(-7);
            
            var userPosts = await db.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Where(u => db.Posts.Any(p => p.AuthorId == u.Id && p.CreatedAt >= last7Days))
                .Select(u => new UserPostActivityDto
                {
                    UserId = u.Id,
                    Username = u.Username,
                    Role = u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "Blogger",
                    PostsLast7Days = db.Posts.Count(p => p.AuthorId == u.Id && p.CreatedAt >= last7Days),
                    PublishedLast7Days = db.Posts.Count(p => p.AuthorId == u.Id && p.CreatedAt >= last7Days && p.Status == PostStatus.Published),
                    DraftLast7Days = db.Posts.Count(p => p.AuthorId == u.Id && p.CreatedAt >= last7Days && p.Status == PostStatus.Draft),
                    PendingLast7Days = db.Posts.Count(p => p.AuthorId == u.Id && p.CreatedAt >= last7Days && p.Status == PostStatus.PendingReview)
                })
                .OrderByDescending(u => u.PostsLast7Days)
                .ToListAsync();

            return userPosts;
        }
    }
}
