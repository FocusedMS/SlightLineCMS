using System.Text.RegularExpressions;
namespace BlogCms.Api.Utils;
public static class SlugGenerator
{
    public static string Generate(string text)
    {
        text = text.ToLowerInvariant().Trim();
        text = Regex.Replace(text, @"[^\w\s-]", "");
        text = Regex.Replace(text, @"\s+", "-");
        text = Regex.Replace(text, "-{2,}", "-");
        return text.Trim('-');
    }
}
