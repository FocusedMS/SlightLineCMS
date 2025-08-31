namespace BlogCms.Api.Domain.Entities;
public class SeoSnapshot
{
    public int Id { get; set; }
    public int PostId { get; set; }
    public Post Post { get; set; } = default!;
    public int Score { get; set; }
    public string SuggestionsJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
