using BlogCms.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BlogCms.Api.Data;

public class BlogDbContext(DbContextOptions<BlogDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<PostTag> PostTags => Set<PostTag>();
    public DbSet<Media> Media => Set<Media>();
    public DbSet<SeoSnapshot> SeoSnapshots => Set<SeoSnapshot>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(u => u.Email).IsUnique();
        b.Entity<User>().HasIndex(u => u.Username).IsUnique();
        b.Entity<Role>().HasIndex(r => r.Name).IsUnique();

        b.Entity<Post>().HasIndex(p => p.Slug).IsUnique();
        b.Entity<Post>().HasIndex(p => new { p.Status, p.PublishedAt });

        b.Entity<Tag>().HasIndex(t => t.Name).IsUnique();
        b.Entity<Category>().HasIndex(c => c.Slug).IsUnique();

        b.Entity<UserRole>().HasKey(ur => new { ur.UserId, ur.RoleId });
        b.Entity<UserRole>().HasOne(ur => ur.User).WithMany(u => u.UserRoles).HasForeignKey(ur => ur.UserId);
        b.Entity<UserRole>().HasOne(ur => ur.Role).WithMany(r => r.UserRoles).HasForeignKey(ur => ur.RoleId);

        b.Entity<PostTag>().HasKey(pt => new { pt.PostId, pt.TagId });
        b.Entity<PostTag>().HasOne(pt => pt.Post).WithMany(p => p.PostTags).HasForeignKey(pt => pt.PostId);
        b.Entity<PostTag>().HasOne(pt => pt.Tag).WithMany(t => t.PostTags).HasForeignKey(pt => pt.TagId);
    }
}
