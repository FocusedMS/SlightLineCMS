using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BlogCms.Api.Domain.Entities;
using BlogCms.Api.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace BlogCms.Tests.Services;

public class JwtTokenServiceTests
{
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly JwtTokenService _jwtService;
    private readonly User _testUser;

    public JwtTokenServiceTests()
    {
        _mockConfiguration = new Mock<IConfiguration>();
        _mockConfiguration.Setup(x => x["Jwt:Key"]).Returns("test-secret-key-that-is-long-enough-for-hmacsha256");
        _mockConfiguration.Setup(x => x["Jwt:ExpiresMinutes"]).Returns("60");
        _mockConfiguration.Setup(x => x["Jwt:Issuer"]).Returns("test-issuer");
        _mockConfiguration.Setup(x => x["Jwt:Audience"]).Returns("test-audience");

        _jwtService = new JwtTokenService(_mockConfiguration.Object);

        _testUser = new User
        {
            Id = 1,
            Username = "testuser",
            Email = "test@example.com"
        };
    }

    [Fact]
    public void GenerateToken_ValidUserAndRole_ReturnsValidToken()
    {
        // Act
        var (token, expiration) = _jwtService.GenerateToken(_testUser, "Admin");

        // Assert
        token.Should().NotBeNullOrEmpty();
        expiration.Should().BeAfter(DateTime.UtcNow);
        expiration.Should().BeBefore(DateTime.UtcNow.AddHours(2));
    }

    [Fact]
    public void GenerateToken_ContainsCorrectClaims()
    {
        // Act
        var (token, _) = _jwtService.GenerateToken(_testUser, "Blogger");

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        jwtToken.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == _testUser.Id.ToString());
        jwtToken.Claims.Should().Contain(c => c.Type == "name" && c.Value == _testUser.Username);
        jwtToken.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == "Blogger");
        jwtToken.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Iss && c.Value == "test-issuer");
        jwtToken.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Aud && c.Value == "test-audience");
    }

    [Fact]
    public void GenerateToken_DifferentRoles_GenerateDifferentRoleClaims()
    {
        // Act
        var (adminToken, _) = _jwtService.GenerateToken(_testUser, "Admin");
        var (bloggerToken, _) = _jwtService.GenerateToken(_testUser, "Blogger");

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var adminJwt = handler.ReadJwtToken(adminToken);
        var bloggerJwt = handler.ReadJwtToken(bloggerToken);

        adminJwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == "Admin");
        bloggerJwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == "Blogger");
    }

    [Fact]
    public void GenerateToken_ExpirationTime_IsCorrect()
    {
        // Arrange
        var expectedExpiration = DateTime.UtcNow.AddMinutes(60);

        // Act
        var (_, expiration) = _jwtService.GenerateToken(_testUser, "Admin");

        // Assert
        expiration.Should().BeCloseTo(expectedExpiration, TimeSpan.FromMinutes(1));
    }

    [Fact]
    public void GenerateToken_CustomExpirationMinutes_Respected()
    {
        // Arrange
        _mockConfiguration.Setup(x => x["Jwt:ExpiresMinutes"]).Returns("120");
        var jwtService = new JwtTokenService(_mockConfiguration.Object);
        var expectedExpiration = DateTime.UtcNow.AddMinutes(120);

        // Act
        var (_, expiration) = jwtService.GenerateToken(_testUser, "Admin");

        // Assert
        expiration.Should().BeCloseTo(expectedExpiration, TimeSpan.FromMinutes(1));
    }

    [Fact]
    public void GenerateToken_DefaultExpirationMinutes_UsedWhenNotConfigured()
    {
        // Arrange
        _mockConfiguration.Setup(x => x["Jwt:ExpiresMinutes"]).Returns((string?)null);
        var jwtService = new JwtTokenService(_mockConfiguration.Object);
        var expectedExpiration = DateTime.UtcNow.AddMinutes(60);

        // Act
        var (_, expiration) = jwtService.GenerateToken(_testUser, "Admin");

        // Assert
        expiration.Should().BeCloseTo(expectedExpiration, TimeSpan.FromMinutes(1));
    }

    [Fact]
    public void GenerateToken_TokenIsValidJwtFormat()
    {
        // Act
        var (token, _) = _jwtService.GenerateToken(_testUser, "Admin");

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var canRead = handler.CanReadToken(token);
        canRead.Should().BeTrue();
    }

    [Fact]
    public void GenerateToken_DifferentUsers_GenerateDifferentSubjectClaims()
    {
        // Arrange
        var user1 = new User { Id = 1, Username = "user1" };
        var user2 = new User { Id = 2, Username = "user2" };

        // Act
        var (token1, _) = _jwtService.GenerateToken(user1, "Admin");
        var (token2, _) = _jwtService.GenerateToken(user2, "Admin");

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwt1 = handler.ReadJwtToken(token1);
        var jwt2 = handler.ReadJwtToken(token2);

        jwt1.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == "1");
        jwt2.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == "2");
    }
}
