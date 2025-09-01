using BlogCms.Api.DTOs;
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
    /// Controller for managing media uploads including image processing, storage, and retrieval.
    /// Provides endpoints for uploading, processing, and serving media files with automatic optimization.
    /// </summary>
    [ApiController]
    [ApiExplorerSettings(GroupName = "Media")]
    [Route("api/[controller]")]
    [Authorize] // require auth to upload
    [Produces("application/json")]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    [ProducesResponseType(typeof(ProblemDetails), 413)]
    [ProducesResponseType(typeof(ProblemDetails), 415)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public class MediaController(IWebHostEnvironment env, ILogger<MediaController> log) : ControllerBase
    {
        /// <summary>
        /// Uploads and processes an image file with automatic optimization and storage.
        /// </summary>
        /// <param name="req">Multipart form data containing the image file and optional metadata.</param>
        /// <returns>
        /// <list type="bullet">
        /// <item><description>200 OK - Image successfully uploaded and processed with metadata.</description></item>
        /// <item><description>400 Bad Request - No file provided or invalid request format.</description></item>
        /// <item><description>401 Unauthorized - Missing or invalid authentication token.</description></item>
        /// <item><description>413 Payload Too Large - File size exceeds 10MB limit.</description></item>
        /// <item><description>415 Unsupported Media Type - File format not supported (only JPEG, PNG, WEBP).</description></item>
        /// </list>
        /// </returns>
        /// <remarks>
        /// This endpoint handles image uploads with comprehensive processing and validation:
        /// 
        /// **Supported Formats:** JPEG, PNG, WEBP
        /// **Maximum File Size:** 10MB
        /// **Image Processing:**
        /// - Automatic resizing to max width of 1600px (maintains aspect ratio)
        /// - Image format validation and optimization
        /// - Secure filename generation with UUID
        /// - Organized storage in folder structure
        /// 
        /// **Security Features:**
        /// - File type validation
        /// - Size limit enforcement
        /// - Secure filename sanitization
        /// - Authentication required
        /// 
        /// **Storage Structure:**
        /// - Files stored in `/wwwroot/media/{folder}/`
        /// - Default folder: "posts"
        /// - Filename format: `{sanitized-name}-{guid}.{extension}`
        /// 
        /// **Required Roles:** Any authenticated user
        /// 
        /// Example request (multipart/form-data):
        /// <code>
        /// POST /api/Media/upload
        /// Content-Type: multipart/form-data
        /// 
        /// file: [binary image data]
        /// folder: "blog-posts" (optional)
        /// alt: "Descriptive alt text" (optional)
        /// </code>
        /// 
        /// Example response:
        /// <code>
        /// {
        ///   "fileName": "my-image-abc123def456.jpg",
        ///   "url": "/media/posts/my-image-abc123def456.jpg",
        ///   "width": 1200,
        ///   "height": 800,
        ///   "alt": "Descriptive alt text",
        ///   "size": 245760
        /// }
        /// </code>
        /// </remarks>
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]     // <-- key for Swagger
        [RequestSizeLimit(10_000_000)]        // 10 MB hard limit at server
        [ProducesResponseType(typeof(MediaUploadResponse), 200)]
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
