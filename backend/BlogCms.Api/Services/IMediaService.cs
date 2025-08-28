using BlogCms.Api.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace BlogCms.Api.Services;
public interface IMediaService
{
    Task<Media> UploadAsync(IFormFile file, int uploaderId);
    Task DeleteAsync(Media media);
}
