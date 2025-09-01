using BlogCms.Api.Data;
using BlogCms.Api.Domain.Entities;
using BlogCms.Api.DTOs;
using BlogCms.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BCryptNet = BCrypt.Net.BCrypt;

namespace BlogCms.Api.Controllers;

/// <summary>
/// Authentication controller for user registration and login operations.
/// Provides endpoints for user account management and JWT token generation.
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "Auth")]
[Route("api/[controller]")]
[Produces("application/json")]
[ProducesResponseType(typeof(ProblemDetails), 400)]
[ProducesResponseType(typeof(ProblemDetails), 401)]
[ProducesResponseType(typeof(ProblemDetails), 500)]
public class AuthController(BlogDbContext db, JwtTokenService jwt) : ControllerBase
{
    /// <summary>
    /// Registers a new user account and assigns the Blogger role.
    /// </summary>
    /// <param name="dto">User registration information including email, username, and password.</param>
    /// <returns>
    /// <list type="bullet">
    /// <item><description>200 OK - User successfully registered with a success message.</description></item>
    /// <item><description>400 Bad Request - Email or username already exists, or validation errors.</description></item>
    /// <item><description>500 Internal Server Error - Database or server errors.</description></item>
    /// </list>
    /// </returns>
    /// <remarks>
    /// This endpoint creates a new user account with the following validations:
    /// - Email must be unique and valid format
    /// - Username must be unique and between 3-32 characters
    /// - Password must be between 6-100 characters
    /// - Automatically assigns the "Blogger" role to new users
    /// 
    /// Example request:
    /// <code>
    /// {
    ///   "email": "user@example.com",
    ///   "username": "newuser",
    ///   "password": "SecurePass123!"
    /// }
    /// </code>
    /// </remarks>
    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterResponse), 200)]
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
        return Ok(new RegisterResponse { Message = "Registered" });
    }

    /// <summary>
    /// Authenticates a user and returns a JWT token for API access.
    /// </summary>
    /// <param name="dto">User login credentials (username/email and password).</param>
    /// <returns>
    /// <list type="bullet">
    /// <item><description>200 OK - Authentication successful with JWT token and user information.</description></item>
    /// <item><description>401 Unauthorized - Invalid credentials or inactive account.</description></item>
    /// <item><description>400 Bad Request - Validation errors in request format.</description></item>
    /// </list>
    /// </returns>
    /// <remarks>
    /// This endpoint authenticates users and provides JWT tokens for API access:
    /// - Accepts either username or email for login
    /// - Validates password against BCrypt hash
    /// - Returns JWT token with user role and expiration
    /// - Token expires in 1 hour by default
    /// 
    /// Example request:
    /// <code>
    /// {
    ///   "usernameOrEmail": "user@example.com",
    ///   "password": "SecurePass123!"
    /// }
    /// </code>
    /// 
    /// Example response:
    /// <code>
    /// {
    ///   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    ///   "expiresIn": 3600,
    ///   "user": {
    ///     "id": 1,
    ///     "username": "newuser",
    ///     "role": "Blogger"
    ///   }
    /// }
    /// </code>
    /// </remarks>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), 200)]
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
