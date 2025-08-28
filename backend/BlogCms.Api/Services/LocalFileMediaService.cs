using BlogCms.Api.Data;
using BlogCms.Api.Domain.Entities;
using Microsoft.AspNetCore.Http;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace BlogCms.Api.Services;

public class LocalFileMediaService(BlogDbContext db, IWebHostEnvironment env) : IMediaService
{
    public async Task<Media> UploadAsync(IFormFile file, int uploaderId)
    {
        var uploadsDir = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads");
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!new[] { ".jpg",".jpeg",".png",".webp" }.Contains(ext)) throw new InvalidOperationException("Unsupported file type");

        var name = $"{Guid.NewGuid():N}{ext}";
        var full = Path.Combine(uploadsDir, name);

        using (var stream = file.OpenReadStream())
        using (var image = await Image.LoadAsync(stream))
        {
            // Resize to max width 1600 while keeping aspect
            if (image.Width > 1600)
            {
                image.Mutate(x => x.Resize(new ResizeOptions { Mode = ResizeMode.Max, Size = new Size(1600, 0) }));
            }
            await image.SaveAsync(full, new JpegEncoder { Quality = 85 });
        }

        // Generate thumbnail 600px
        var thumbName = $"{Path.GetFileNameWithoutExtension(name)}_thumb{ext}";
        var thumbFull = Path.Combine(uploadsDir, thumbName);
        using (var image = await Image.LoadAsync(full))
        {
            if (image.Width > 600)
                image.Mutate(x => x.Resize(new ResizeOptions { Mode = ResizeMode.Max, Size = new Size(600, 0) }));
            await image.SaveAsync(thumbFull, new JpegEncoder { Quality = 80 });
        }

        var media = new Media
        {
            Url = $"/uploads/{name}",
            ThumbUrl = $"/uploads/{thumbName}",
            ContentType = file.ContentType,
            Width = 0, Height = 0,
            SizeBytes = file.Length,
            UploaderId = uploaderId,
            CreatedAt = DateTime.UtcNow
        };
        db.Media.Add(media);
        await db.SaveChangesAsync();
        return media;
    }

    public async Task DeleteAsync(Media media)
    {
        var baseDir = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var physical = Path.Combine(baseDir, media.Url.TrimStart('/'));
        if (File.Exists(physical)) File.Delete(physical);
        if (!string.IsNullOrWhiteSpace(media.ThumbUrl))
        {
            var p2 = Path.Combine(baseDir, media.ThumbUrl.TrimStart('/'));
            if (File.Exists(p2)) File.Delete(p2);
        }
        db.Media.Remove(media);
        await db.SaveChangesAsync();
    }
}
