using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BlogCms.Api.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BlogCms.Api.Services;

public class JwtTokenService(IConfiguration cfg)
{
    public (string token, DateTime exp) GenerateToken(User user, string roleName)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var exp = DateTime.UtcNow.AddMinutes(int.Parse(cfg["Jwt:ExpiresMinutes"] ?? "60"));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new("name", user.Username),
            new(ClaimTypes.Role, roleName),
            new(JwtRegisteredClaimNames.Iss, cfg["Jwt:Issuer"]!),
            new(JwtRegisteredClaimNames.Aud, cfg["Jwt:Audience"]!)
        };

        var jwt = new JwtSecurityToken(claims: claims, expires: exp, signingCredentials: creds);
        return (new JwtSecurityTokenHandler().WriteToken(jwt), exp);
    }
}
