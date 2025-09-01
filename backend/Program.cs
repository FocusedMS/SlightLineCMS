using System.Text;
using BlogCms.Api;
using BlogCms.Api.Data;
using BlogCms.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// ---------- Limits ----------
builder.Services.Configure<FormOptions>(o => o.MultipartBodyLengthLimit = 100_000_000);

// ---------- Db ----------
builder.Services.AddDbContext<BlogDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// ---------- MVC + compression/caching ----------
// Configure controllers to use camelCase JSON naming.  This ensures API responses
// return properties like `items` instead of `Items` and plays nicely with JS clients.
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddProblemDetails();

// Add API versioning
builder.Services.AddApiVersioning(options =>
{
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.ReportApiVersions = true;
});
builder.Services.AddVersionedApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = false;
    options.InvalidModelStateResponseFactory = context =>
    {
        var details = new ValidationProblemDetails(context.ModelState)
        {
            Title = "One or more validation errors occurred.",
            Status = StatusCodes.Status400BadRequest
        };
        return new BadRequestObjectResult(details);
    };
});
builder.Services.AddResponseCompression(opts =>
{
    opts.Providers.Add<GzipCompressionProvider>();
    opts.EnableForHttps = true;
});
builder.Services.AddResponseCaching();

// ---------- Swagger ----------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Blog CMS API",
        Version = "v1",
        Description = "A comprehensive ASP.NET Core Web API for Blogging & Content Management System with features including user authentication, post management, SEO analysis, media uploads, and content moderation.",
        Contact = new OpenApiContact
        {
            Name = "Blog CMS Team",
            Email = "support@blogcms.com",
            Url = new Uri("https://github.com/your-repo/blog-cms")
        },
        License = new OpenApiLicense
        {
            Name = "MIT License",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });
    
    // Debug: Log what controllers are being discovered
    Console.WriteLine("Configuring Swagger...");

    // Include XML comments
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
        Console.WriteLine($"XML comments loaded from: {xmlPath}");
    }
    else
    {
        Console.WriteLine($"XML file not found at: {xmlPath}");
    }

    // Add JWT Bearer authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter JWT token as: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = "Bearer"
        }
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Add operation filter for security requirements
    c.OperationFilter<BlogCms.Api.Utils.SecurityRequirementsOperationFilter>();

    // Add custom tags for better organization
    c.TagActionsBy(api =>
    {
        if (api.GroupName != null)
        {
            return new[] { api.GroupName };
        }

        var controllerActionDescriptor = api.ActionDescriptor as Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor;
        if (controllerActionDescriptor != null)
        {
            return new[] { controllerActionDescriptor.ControllerName };
        }

        return new[] { api.ActionDescriptor.DisplayName };
    });

    // Customize operation IDs
    c.CustomOperationIds(apiDesc =>
    {
        return apiDesc.ActionDescriptor is Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor controllerActionDescriptor 
            ? controllerActionDescriptor.ActionName 
            : null;
    });

    // Add request/response examples
    c.SwaggerGeneratorOptions.DescribeAllParametersInCamelCase = true;
});

// ---------- Auth ----------
var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new()
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization();

// ---------- CORS ----------
const string CorsPolicy = "Frontend";
builder.Services.AddCors(o =>
{
    o.AddPolicy(CorsPolicy, p =>
    {
        p.WithOrigins(
             builder.Configuration["Cors:FrontendOrigin"] ?? "http://localhost:5173",
             "http://127.0.0.1:5173",
             "http://localhost:5174",
             "http://127.0.0.1:5174")
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()
         .WithExposedHeaders("ETag"); // so the client can read ETag
    });
});

// ---------- DI services ----------
builder.Services.AddSingleton<SeoService>();
builder.Services.AddScoped<JwtTokenService>();
// Register the media service so it can be swapped out in future (e.g. cloud storage).
builder.Services.AddScoped<IMediaService, LocalFileMediaService>();

var app = builder.Build();

// Enable Swagger in all environments for testing
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Blog CMS API v1");
    options.DocumentTitle = "Blog CMS API Documentation";
    options.DisplayRequestDuration();
    options.DisplayOperationId();
    options.DefaultModelsExpandDepth(2);
    options.DefaultModelRendering(Swashbuckle.AspNetCore.SwaggerUI.ModelRendering.Example);
    options.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List);
    options.EnableDeepLinking();
    options.EnableFilter();
    options.ShowExtensions();
    options.InjectStylesheet("/swagger-ui/custom.css");
    options.InjectJavascript("/swagger-ui/custom.js");
});

// ---------- Middleware order matters ----------
app.UseExceptionHandler();
app.UseResponseCompression();
app.UseStaticFiles();

// CORS must be early, before auth & endpoints
app.UseCors(CorsPolicy);

app.UseResponseCaching();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// (Optional) ensure preflight OPTIONS always succeeds via CORS
// app.MapMethods("{*path}", new[] { "OPTIONS" }, () => Results.Ok()).RequireCors(CorsPolicy);

// ---------- Seed DB ----------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BlogDbContext>();
    await SeedData.EnsureSeededAsync(db);
}

app.Run();

// Make Program class accessible to tests
public partial class Program { }
