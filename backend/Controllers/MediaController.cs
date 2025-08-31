using BlogCms.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using System.Text.RegularExpressions;

namespace BlogCms.Api.Controllers
{
    /// <summary>
    /// Controller for managing media uploads including image processing and storage
    /// </summary>
    [ApiController]
    [ApiExplorerSettings(GroupName = "Media")]
    [Route("api/[controller]")]
    [Authorize] // require auth to upload
    public class MediaController(IWebHostEnvironment env, ILogger<MediaController> log) : ControllerBase
    {
        /// <summary>
        /// Upload an image. Accepts multipart/form-data with fields: file, folder?, alt?
        /// </summary>
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]     // <-- key for Swagger
        [RequestSizeLimit(10_000_000)]        // 10 MB hard limit at server
        public async Task<IActionResult> Upload([FromForm] MediaUploadRequest req)
        {
            if (req.File is null || req.File.Length == 0)
            {
                return new ObjectResult(new ProblemDetails
                {
                    Title = "No file uploaded",
                    Status = StatusCodes.Status400BadRequest
                }) { StatusCode = StatusCodes.Status400BadRequest };
            }

            // Validate size (client-side hint and server-side enforcement)
            const long maxSizeBytes = 10_000_000; // 10 MB
            if (req.File.Length > maxSizeBytes)
            {
                return new ObjectResult(new ProblemDetails
                {
                    Title = "File too large",
                    Detail = "Max allowed size is 10 MB.",
                    Status = StatusCodes.Status413PayloadTooLarge
                }) { StatusCode = StatusCodes.Status413PayloadTooLarge };
            }

            // Validate content type
            var contentType = req.File.ContentType?.ToLowerInvariant() ?? "";
            var allowed = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allowed.Contains(contentType))
            {
                return new ObjectResult(new ProblemDetails
                {
                    Title = "Unsupported media type",
                    Detail = "Only JPEG, PNG, and WEBP images are allowed.",
                    Status = StatusCodes.Status415UnsupportedMediaType
                }) { StatusCode = StatusCodes.Status415UnsupportedMediaType };
            }

            // Resolve web root even if it was null at app start
            var webRoot = env.WebRootPath;
            if (string.IsNullOrWhiteSpace(webRoot))
                webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

            var folder = string.IsNullOrWhiteSpace(req.Folder) ? "posts" : Slugify(req.Folder!);
            var targetDir = Path.Combine(webRoot, "media", folder);
            Directory.CreateDirectory(targetDir); // ensure path exists

            // sanitize filename
            var ext = Path.GetExtension(req.File.FileName).ToLowerInvariant();
            var name = Path.GetFileNameWithoutExtension(req.File.FileName);
            var safeName = Slugify(name);
            var fileName = $"{safeName}-{Guid.NewGuid():N}{ext}";
            var fullPath = Path.Combine(targetDir, fileName);

            // Try to process as image; if it fails, just save the stream. Record dimensions if available.
            int width = 0;
            int height = 0;
            try
            {
                using var input = req.File.OpenReadStream();
                using var image = await Image.LoadAsync(input); // throws if not an image

                width = image.Width;
                height = image.Height;

                // Resize down to a reasonable max width while maintaining aspect ratio
                if (image.Width > 1600)
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Mode = ResizeMode.Max,
                        Size = new Size(1600, 0)
                    }));
                }
                await image.SaveAsync(fullPath);
            }
            catch (Exception ex)
            {
                log.LogWarning(ex, "Image processing failed; saving raw file.");
                using (var fs = System.IO.File.Create(fullPath))
                {
                    await req.File.CopyToAsync(fs);
                }
                // Attempt to determine dimensions from the written file if possible
                try
                {
                    using var img = await Image.LoadAsync(fullPath);
                    width = img.Width;
                    height = img.Height;
                }
                catch { /* ignore */ }
            }

            var url = $"/media/{folder}/{fileName}";
            return Ok(new { fileName, url, width, height, alt = req.Alt, size = req.File.Length });
        }

        private static string Slugify(string input)
        {
            input = input.Trim().ToLowerInvariant();
            input = Regex.Replace(input, @"\s+", "-");
            input = Regex.Replace(input, @"[^a-z0-9\-]", "");
            input = Regex.Replace(input, @"-+", "-");
            return input.Trim('-');
        }
    }
}
