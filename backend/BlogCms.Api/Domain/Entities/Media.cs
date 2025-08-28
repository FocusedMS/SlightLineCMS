namespace BlogCms.Api.Domain.Entities;
public class Media
{
    public int Id { get; set; }
    public string Url { get; set; } = default!;
    public string ContentType { get; set; } = default!;
    public int Width { get; set; }
    public int Height { get; set; }
    public long SizeBytes { get; set; }
    public int UploaderId { get; set; }
    public User Uploader { get; set; } = default!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? ThumbUrl { get; set; }
}
