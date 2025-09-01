using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BlogCms.Api.Data;
using BlogCms.Api.DTOs;
using BlogCms.Api.Domain.Entities;

namespace BlogCms.Api.Controllers
{
    /// <summary>
    /// User management endpoints for admin
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UserManagementController : ControllerBase
    {
        private readonly BlogDbContext db;

        public UserManagementController(BlogDbContext db)
        {
            this.db = db;
        }

        /// <summary>
        /// Get all users with their activity statistics
        /// </summary>
        [HttpGet("users")]
        public async Task<ActionResult<List<UserManagementDto>>> GetUsers()
        {
            var users = await db.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Select(u => new UserManagementDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "Blogger",
                    IsActive = u.IsActive,
                    TotalPosts = db.Posts.Count(p => p.AuthorId == u.Id),
                    PublishedPosts = db.Posts.Count(p => p.AuthorId == u.Id && p.Status == PostStatus.Published),
                    DraftPosts = db.Posts.Count(p => p.AuthorId == u.Id && p.Status == PostStatus.Draft),
                    PendingPosts = db.Posts.Count(p => p.AuthorId == u.Id && p.Status == PostStatus.PendingReview),
                    LastPostDate = db.Posts.Where(p => p.AuthorId == u.Id).OrderByDescending(p => p.CreatedAt).Select(p => p.CreatedAt).FirstOrDefault(),
                    CreatedAt = u.CreatedAt
                })
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return users;
        }

        /// <summary>
        /// Lock/unlock a user account
        /// </summary>
        [HttpPut("users/{userId}/toggle-status")]
        public async Task<ActionResult> ToggleUserStatus(int userId, [FromBody] ToggleUserStatusRequest request)
        {
            var user = await db.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found");

            // Prevent admin from locking themselves
            var currentUserId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            if (userId == currentUserId)
                return BadRequest("Cannot modify your own account status");

            user.IsActive = request.IsActive;
            await db.SaveChangesAsync();

            return Ok(new { message = $"User {(request.IsActive ? "unlocked" : "locked")} successfully" });
        }

        /// <summary>
        /// Get user details with full activity history
        /// </summary>
        [HttpGet("users/{userId}")]
        public async Task<ActionResult<UserDetailDto>> GetUserDetail(int userId)
        {
            var user = await db.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound("User not found");

            var userPosts = await db.Posts
                .Include(p => p.Category)
                .Where(p => p.AuthorId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .Take(10)
                .Select(p => new UserPostDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Status = p.Status.ToString(),
                    Category = p.Category != null ? p.Category.Name : "Uncategorized",
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .ToListAsync();

            var userDetail = new UserDetailDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "Blogger",
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                TotalPosts = await db.Posts.CountAsync(p => p.AuthorId == userId),
                PublishedPosts = await db.Posts.CountAsync(p => p.AuthorId == userId && p.Status == PostStatus.Published),
                DraftPosts = await db.Posts.CountAsync(p => p.AuthorId == userId && p.Status == PostStatus.Draft),
                PendingPosts = await db.Posts.CountAsync(p => p.AuthorId == userId && p.Status == PostStatus.PendingReview),
                RecentPosts = userPosts
            };

            return userDetail;
        }

        /// <summary>
        /// Delete a user account (soft delete by deactivating)
        /// </summary>
        [HttpDelete("users/{userId}")]
        public async Task<ActionResult> DeleteUser(int userId)
        {
            var user = await db.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found");

            // Prevent admin from deleting themselves
            var currentUserId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
            if (userId == currentUserId)
                return BadRequest("Cannot delete your own account");

            // Soft delete by deactivating
            user.IsActive = false;
            await db.SaveChangesAsync();

            return Ok(new { message = "User account deactivated successfully" });
        }
    }
}
