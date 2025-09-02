using System;
using System.Collections.Generic;

namespace BlogCms.Api.DTOs
{
    // Root payload returned by /api/Analytics/dashboard
    public class DashboardMetrics
    {
        public required PostMetrics Posts { get; set; }
        public required UserMetrics Users { get; set; }
        public required CategoryMetrics Categories { get; set; }
        public required List<RecentPostDto> RecentPosts { get; set; }
        public required List<RecentUserDto> RecentUsers { get; set; }
    }

    public class PostMetrics
    {
        public int Total { get; set; }
        public int Last24Hours { get; set; }
        public int Last7Days { get; set; }
        public int Last30Days { get; set; }
        public int Published { get; set; }
        public int Draft { get; set; }
        public int PendingReview { get; set; }
    }

    public class UserMetrics
    {
        public int Total { get; set; }
        public int Last24Hours { get; set; }
        public int Last7Days { get; set; }
        public int Last30Days { get; set; }
        public int Active { get; set; }
        public int Inactive { get; set; }
    }

    public class CategoryMetrics
    {
        public int Total { get; set; }
        public int WithPosts { get; set; }
    }

    public class RecentPostDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class RecentUserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CategoryStatsDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int TotalPosts { get; set; }
        public int PublishedPosts { get; set; }
        public int DraftPosts { get; set; }
        public int PendingPosts { get; set; }
        public DateTime? LastPostDate { get; set; }
    }

    public class UserActivityDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int TotalPosts { get; set; }
        public int PublishedPosts { get; set; }
        public DateTime? LastPostDate { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UserPostActivityDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int PostsLast7Days { get; set; }
        public int PublishedLast7Days { get; set; }
        public int DraftLast7Days { get; set; }
        public int PendingLast7Days { get; set; }
    }
}


