using BlogCms.Api.Data;
using BlogCms.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using BCryptNet = BCrypt.Net.BCrypt;

namespace BlogCms.Api
{
    public static class SeedData
    {
        public static async Task EnsureSeededAsync(BlogDbContext db)
        {
            // Apply pending migrations if any
            await db.Database.MigrateAsync();

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
                    PasswordHash = BCryptNet.HashPassword("Admin@123")
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

            // --- Default category ---
            if (!await db.Categories.AnyAsync())
            {
                db.Categories.Add(new Category { Name = "General", Slug = "general" });
                await db.SaveChangesAsync();
            }
        }
    }
}
