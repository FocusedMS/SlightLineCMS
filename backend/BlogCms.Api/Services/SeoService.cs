using System.Text.RegularExpressions;
using System.Linq;

namespace BlogCms.Api.Services
{
    public record SeoSuggestion(string Type, string Message, string Severity);
    public record SeoResult(int Score, List<SeoSuggestion> Suggestions);

    public class SeoService
    {
        public SeoResult Analyze(string title, string? excerpt, string contentHtml, string? focusKeyword, string? slug)
        {
            var suggestions = new List<SeoSuggestion>();
            int score = 100;

            // Title & description lengths
            if (string.IsNullOrWhiteSpace(title) || title.Length < 45 || title.Length > 60)
            { score -= 8; suggestions.Add(new("title", "Keep title between 45–60 characters.", "info")); }

            if (string.IsNullOrWhiteSpace(excerpt) || excerpt!.Length < 120 || excerpt.Length > 160)
            { score -= 8; suggestions.Add(new("description", "Meta description should be 120–160 characters.", "warn")); }

            // Keyword checks
            if (!string.IsNullOrWhiteSpace(focusKeyword))
            {
                var kw = focusKeyword!.Trim();
                var htmlLower = contentHtml.ToLowerInvariant();
                var titleLower = (title ?? "").ToLowerInvariant();
                var firstParaMatch = Regex.Match(htmlLower, "<p>(.*?)</p>", RegexOptions.Singleline | RegexOptions.IgnoreCase);
                var firstPara = firstParaMatch.Value;

                if (!titleLower.Contains(kw, StringComparison.OrdinalIgnoreCase))
                { score -= 4; suggestions.Add(new("keyword", "Focus keyword not in title.", "warn")); }

                if (string.IsNullOrWhiteSpace(firstPara) || !firstPara.Contains(kw, StringComparison.OrdinalIgnoreCase))
                { score -= 4; suggestions.Add(new("keyword", "Use focus keyword in the first paragraph.", "warn")); }

                if (!string.IsNullOrWhiteSpace(slug) && !slug.Contains(kw, StringComparison.OrdinalIgnoreCase))
                { score -= 2; suggestions.Add(new("keyword", "Include focus keyword in the slug.", "info")); }

                // Density (rough)
                var plain = Regex.Replace(htmlLower, "<.*?>", " ");
                var words = Regex.Split(plain, @"\W+").Where(w => !string.IsNullOrWhiteSpace(w)).ToList();
                var kwCount = words.Count(w => string.Equals(w, kw, StringComparison.OrdinalIgnoreCase));
                var density = words.Count == 0 ? 0.0 : (kwCount * 100.0 / words.Count);
                if (density < 0.5 || density > 2.5)
                { score -= 4; suggestions.Add(new("keyword-density", "Keep keyword density around 0.5–2.5%.", "info")); }
            }

            // Headings hierarchy
            var h1Count = Regex.Matches(contentHtml, "<h1", RegexOptions.IgnoreCase).Count;
            if (h1Count != 1)
            { score -= 4; suggestions.Add(new("headings", "Use exactly one H1 and logical H2/H3 structure.", "info")); }

            // Links
            var internalLinks = Regex.Matches(contentHtml, "<a[^>]+href=\"/(.*?)\"", RegexOptions.IgnoreCase).Count;
            var externalLinks = Regex.Matches(contentHtml, "<a[^>]+href=\"https?://", RegexOptions.IgnoreCase).Count;
            if (internalLinks < 1) { score -= 2; suggestions.Add(new("links", "Add at least one internal link.", "info")); }
            if (externalLinks < 1) { score -= 2; suggestions.Add(new("links", "Add at least one external link.", "info")); }

            // Images alt
            var missingAlt = Regex.Matches(contentHtml, "<img(?![^>]*alt=)[^>]*>", RegexOptions.IgnoreCase).Count;
            if (missingAlt > 0) { score -= 4; suggestions.Add(new("images", "Add alt text to images.", "warn")); }

            // Word count
            var textOnly = Regex.Replace(contentHtml, "<.*?>", " ");
            var wordCount = Regex.Split(textOnly.Trim(), @"\s+").Count(w => !string.IsNullOrWhiteSpace(w));
            if (wordCount < 600) { score -= 6; suggestions.Add(new("length", "Aim for at least 600 words.", "info")); }

            // Readability (very rough)
            var sentences = Regex.Split(textOnly.Trim(), @"[.!?]+").Where(s => s.Trim().Length > 0).ToList();
            var totalWords = Regex.Split(textOnly.Trim(), @"\s+").Where(w => !string.IsNullOrWhiteSpace(w)).Count();
            var avgWords = sentences.Count == 0 ? 0.0 : (double)totalWords / sentences.Count;
            if (avgWords > 30) { score -= 4; suggestions.Add(new("readability", "Shorten sentences for readability.", "info")); }

            score = Math.Clamp(score, 0, 100);
            return new SeoResult(score, suggestions);
        }
    }
}
