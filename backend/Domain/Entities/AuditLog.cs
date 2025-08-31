namespace BlogCms.Api.Domain.Entities;
public class AuditLog
{
    public int Id { get; set; }
    public int ActorId { get; set; }
    public string Action { get; set; } = default!;
    public string Entity { get; set; } = default!;
    public int EntityId { get; set; }
    public string? PayloadJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
