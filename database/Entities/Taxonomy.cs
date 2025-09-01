namespace BlogCms.Api.Domain.Entities;
public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string Slug { get; set; } = default!;
    public ICollection<Post> Posts { get; set; } = new List<Post>();
}
public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string Slug { get; set; } = default!;
    public ICollection<PostTag> PostTags { get; set; } = new List<PostTag>();
}
public class PostTag
{
    public int PostId { get; set; }
    public Post Post { get; set; } = default!;
    public int TagId { get; set; }
    public Tag Tag { get; set; } = default!;
}
