using System.Net;
using System.Net.Http.Json;
using BlogCms.Api.DTOs;
using BlogCms.Api.Domain.Entities;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BlogCms.Tests;

/// <summary>
/// Integration tests for the PostsController using the ASP.NET Core test host.
/// These tests use an in-memory database to avoid touching production data.
/// </summary>
public class PostsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public PostsControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace SQL Server with in-memory provider
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<BlogCms.Api.Data.BlogDbContext>));
                if (descriptor != null) services.Remove(descriptor);
                services.AddDbContext<BlogCms.Api.Data.BlogDbContext>(o => o.UseInMemoryDatabase("Tests"));
            });
        });
    }

    [Fact]
    public async Task Get_List_ReturnsOkAndPagedResult()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/Posts");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var json = await resp.Content.ReadFromJsonAsync<PagedResult<PostResponse>>();
        Assert.NotNull(json);
        Assert.True(json!.Items != null);
    }

    /// <summary>
    /// Ensures that the posts list endpoint emits an ETag header and that
    /// conditional requests using If‑None‑Match return 304 when unchanged.
    /// </summary>
    [Fact]
    public async Task Get_List_Returns304_WhenNotModified()
    {
        var client = _factory.CreateClient();
        // initial request to obtain the ETag
        var resp1 = await client.GetAsync("/api/Posts");
        Assert.Equal(HttpStatusCode.OK, resp1.StatusCode);
        var etag = resp1.Headers.ETag?.Tag;
        Assert.False(string.IsNullOrWhiteSpace(etag));

        // second request with If-None-Match header set to ETag
        var req = new HttpRequestMessage(HttpMethod.Get, "/api/Posts");
        if (etag != null)
        {
            req.Headers.TryAddWithoutValidation("If-None-Match", etag);
        }
        var resp2 = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.NotModified, resp2.StatusCode);
    }
}