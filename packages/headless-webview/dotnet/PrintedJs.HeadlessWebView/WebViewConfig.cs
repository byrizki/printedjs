using System.Collections.Generic;

namespace PrintedJs.HeadlessWebView;

public record WebViewConfig
{
    public string? Url { get; init; }

    public string? Html { get; init; }

    public string? UserAgent { get; init; }

    public bool Devtools { get; init; } = false;

    public bool Transparent { get; init; } = false;

    public IReadOnlyList<string> InitializationScripts { get; init; } = new List<string>();
}
