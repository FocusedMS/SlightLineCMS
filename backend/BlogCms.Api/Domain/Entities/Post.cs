namespace BlogCms.Api.Domain.Entities;
public enum PostStatus { Draft=0, PendingReview=1, Published=2, Rejected=3 }
public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = default!;
    public string Slug { get; set; } = default!;
    public string? Excerpt { get; set; }
    public string ContentHtml { get; set; } = default!;
    public string? CoverImageUrl { get; set; }
    public PostStatus Status { get; set; } = PostStatus.Draft;
    public int AuthorId { get; set; }
    public User Author { get; set; } = default!;
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
    public ICollection<PostTag> PostTags { get; set; } = new List<PostTag>();
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
