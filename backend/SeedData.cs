using BlogCms.Api.Data;
using BlogCms.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using BCryptNet = BCrypt.Net.BCrypt;
using System.Text.RegularExpressions;

namespace BlogCms.Api
{
    public static class SeedData
    {
        public static async Task EnsureSeededAsync(BlogDbContext db)
        {
            // Apply pending migrations if any (skip for in-memory database)
            if (db.Database.IsRelational())
            {
                await db.Database.MigrateAsync();
            }

            // --- Roles (no explicit IDs; let SQL identity handle it) ---
            var roles = await db.Roles.ToListAsync();
            if (!roles.Any(r => r.Name == "Admin"))
                db.Roles.Add(new Role { Name = "Admin" });
            if (!roles.Any(r => r.Name == "Blogger"))
                db.Roles.Add(new Role { Name = "Blogger" });
            if (db.ChangeTracker.HasChanges())
                await db.SaveChangesAsync();

            var adminRoleId = await db.Roles
                .Where(r => r.Name == "Admin")
                .Select(r => r.Id)
                .FirstAsync();

            // --- Admin user ---
            var admin = await db.Users.FirstOrDefaultAsync(u => u.Username == "admin");
            if (admin == null)
            {
                admin = new User
                {
                    Email = "admin@example.com",
                    Username = "admin",
                    PasswordHash = BCryptNet.HashPassword("Admin@123456")
                };
                db.Users.Add(admin);
                await db.SaveChangesAsync();
            }

            // --- Admin role mapping ---
            var hasAdminRole = await db.UserRoles
                .AnyAsync(ur => ur.UserId == admin.Id && ur.RoleId == adminRoleId);
            if (!hasAdminRole)
            {
                db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = adminRoleId });
                await db.SaveChangesAsync();
            }

            // --- Seed a default blogger user if none exist ---
            var bloggerExists = await db.Users.AnyAsync(u => u.Username == "blogger" || u.Email == "madhu@example.com");
            if (!bloggerExists)
            {
                var bloggerUser = new User
                {
                    Email = "madhu@example.com",
                    Username = "blogger",
                    PasswordHash = BCryptNet.HashPassword("Madhu@123")
                };
                db.Users.Add(bloggerUser);
                await db.SaveChangesAsync();
                var bloggerRoleId = await db.Roles.Where(r => r.Name == "Blogger").Select(r => r.Id).FirstAsync();
                db.UserRoles.Add(new UserRole { UserId = bloggerUser.Id, RoleId = bloggerRoleId });
                await db.SaveChangesAsync();
            }

            // --- Categories ---
            await EnsureCategoriesAsync(db);
        }

        private static string Slugify(string input)
        {
            var t = (input ?? "").Trim().ToLowerInvariant();
            t = Regex.Replace(t, @"[^a-z0-9]+", "-");
            t = Regex.Replace(t, @"-+", "-").Trim('-');
            return string.IsNullOrWhiteSpace(t) ? Guid.NewGuid().ToString("n") : t;
        }

        private static async Task EnsureCategoriesAsync(BlogDbContext db)
        {
            var defaults = new[]
            {
                "General",
                "Technology",
                "Programming",
                "AI & Data",
                "Design & UX",
                "Productivity",
                "Business & Startups",
                "Finance & Investing",
                "Marketing & SEO",
                "Health & Fitness",
                "Food & Recipes",
                "Travel",
                "Education & Learning",
                "Lifestyle",
                "Photography",
                "DIY & Maker",
                "Gaming",
                "Science",
                "Sports",
                "News & Opinions"
            };

            var existing = await db.Categories
                .AsNoTracking()
                .Select(c => new { c.Name, c.Slug })
                .ToListAsync();

            foreach (var name in defaults)
            {
                if (existing.Any(e => e.Name.Equals(name, StringComparison.OrdinalIgnoreCase)))
                    continue;

                var slug = Slugify(name);
                var i = 1;
                var baseSlug = slug;
                while (await db.Categories.AnyAsync(c => c.Slug == slug))
                {
                    slug = $"{baseSlug}-{i++}";
                }

                db.Categories.Add(new Category { Name = name, Slug = slug });
            }

            if (db.ChangeTracker.HasChanges())
                await db.SaveChangesAsync();
        }
    }
}
