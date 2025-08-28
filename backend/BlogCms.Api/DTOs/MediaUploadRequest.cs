using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace BlogCms.Api.Dtos
{
    public class MediaUploadRequest
    {
        [Required] public IFormFile File { get; set; } = default!;
        public string? Folder { get; set; } = "posts";
        public string? Alt { get; set; }
    }
}
