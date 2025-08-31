using BlogCms.Api.Data;
using BlogCms.Api.Domain.Entities;
using BlogCms.Api.DTOs;
using BlogCms.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BCryptNet = BCrypt.Net.BCrypt;

namespace BlogCms.Api.Controllers;

/// <summary>
/// Authentication controller for user registration and login
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "Auth")]
[Route("api/[controller]")]
public class AuthController(BlogDbContext db, JwtTokenService jwt) : ControllerBase
{
    /// <summary>
    /// Registers a new blogger and returns a success message
    /// </summary>
    /// <param name="dto">User registration information</param>
    /// <returns>Success message upon registration</returns>
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest dto)
    {
        // Prevent duplicate accounts on email or username
        if (await db.Users.AnyAsync(u => u.Email == dto.Email || u.Username == dto.Username))
            return BadRequest("Email or Username already in use.");

        // Create the user record
        var user = new User
        {
            Email = dto.Email,
            Username = dto.Username,
            PasswordHash = BCryptNet.HashPassword(dto.Password)
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Assign the newly created user the Blogger role. Don't assume a hard‑coded RoleId;
        // instead look up the role by name so seeding order or migrations don't break registration.
        var bloggerRoleId = await db.Roles.Where(r => r.Name == "Blogger").Select(r => r.Id).FirstOrDefaultAsync();
        if (bloggerRoleId == 0)
        {
            // Fall back to creating the Blogger role if it doesn't exist yet (should be seeded).
            var role = new Role { Name = "Blogger" };
            db.Roles.Add(role);
            await db.SaveChangesAsync();
            bloggerRoleId = role.Id;
        }
        db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = bloggerRoleId });
        await db.SaveChangesAsync();
        return Ok(new { message = "Registered" });
    }

    /// <summary>
    /// Authenticates a user and returns a JWT token
    /// </summary>
    /// <param name="dto">User login credentials</param>
    /// <returns>JWT token and user information</returns>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest dto)
    {
        var user = await db.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == dto.UsernameOrEmail || u.Username == dto.UsernameOrEmail);
        if (user is null || !BCryptNet.Verify(dto.Password, user.PasswordHash) || !user.IsActive)
            return Unauthorized();

        var role = user.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "Blogger";
        var (token, exp) = jwt.GenerateToken(user, role);
        return new AuthResponse { Token = token, ExpiresIn = (int)(exp - DateTime.UtcNow).TotalSeconds, User = new { id = user.Id, user.Username, role } };
    }
}
