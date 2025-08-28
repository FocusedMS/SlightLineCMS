namespace BlogCms.Api.Domain.Entities;
public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
public class UserRole
{
    public int UserId { get; set; }
    public User User { get; set; } = default!;
    public int RoleId { get; set; }
    public Role Role { get; set; } = default!;
}
