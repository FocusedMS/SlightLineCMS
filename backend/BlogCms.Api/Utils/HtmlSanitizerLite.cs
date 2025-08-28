using System.Text.RegularExpressions;

namespace BlogCms.Api.Utils
{
    /// <summary>
    /// Lightweight HTML sanitizer: strips scripts, styles, dangerous tags and inline handlers.
    /// </summary>
    public static class HtmlSanitizerLite
    {
        static readonly Regex ScriptTag = new("<script.*?>.*?</script>", RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.Compiled);
        static readonly Regex StyleTag  = new("<style.*?>.*?</style>",   RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.Compiled);
        static readonly string[] Dangerous = new[] { "iframe", "object", "embed" };
        static readonly Regex OnAttr = new(@"\son\w+\s*=\s*(""[^""]*""|'[^']*'|[^\s>]+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        static readonly Regex JsHref = new(@"href\s*=\s*(['""]?)javascript:", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        static readonly Regex DataSrc = new(@"src\s*=\s*(['""]?)data:", RegexOptions.IgnoreCase | RegexOptions.Compiled);

        public static string Sanitize(string html)
        {
            if (string.IsNullOrWhiteSpace(html)) return string.Empty;

            // Remove script/style blocks
            html = ScriptTag.Replace(html, "");
            html = StyleTag.Replace(html, "");

            // Remove dangerous container tags
            foreach (var tag in Dangerous)
            {
                html = Regex.Replace(html, $@"</?{tag}[^>]*>", "", RegexOptions.IgnoreCase);
            }

            // Strip inline event handlers like onclick=
            html = OnAttr.Replace(html, "");

            // Neutralize javascript: in href and data: in src
            html = JsHref.Replace(html, @"href=$1#");
            html = DataSrc.Replace(html, @"src=$1");

            return html;
        }
    }
}
