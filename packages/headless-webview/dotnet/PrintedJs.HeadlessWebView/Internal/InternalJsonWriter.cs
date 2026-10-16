using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace PrintedJs.HeadlessWebView.Internal;

internal static class InternalJsonWriter
{
    public static string SerializeConfig(WebViewConfig config)
    {
        if (config == null) throw new ArgumentNullException(nameof(config));

        var sb = new StringBuilder();
        sb.Append('{');

        sb.Append("\"url\":");
        WriteNullableString(sb, config.Url);
        sb.Append(',');

        sb.Append("\"html\":");
        WriteNullableString(sb, config.Html);
        sb.Append(',');

        sb.Append("\"user_agent\":");
        WriteNullableString(sb, config.UserAgent);
        sb.Append(',');

        sb.Append("\"devtools\":").Append(config.Devtools ? "true" : "false").Append(',');
        sb.Append("\"transparent\":").Append(config.Transparent ? "true" : "false").Append(',');

        sb.Append("\"initialization_scripts\":[");
        if (config.InitializationScripts != null)
        {
            for (int i = 0; i < config.InitializationScripts.Count; i++)
            {
                if (i > 0) sb.Append(',');
                WriteString(sb, config.InitializationScripts[i]);
            }
        }
        sb.Append(']');

        sb.Append('}');
        return sb.ToString();
    }

    public static string SerializePrintOptions(PdfPrintOptions options)
    {
        if (options == null) throw new ArgumentNullException(nameof(options));

        var inv = CultureInfo.InvariantCulture;
        var sb = new StringBuilder();
        sb.Append('{');

        sb.Append("\"landscape\":").Append(options.Landscape ? "true" : "false").Append(',');

        sb.Append("\"page_width\":");
        if (options.PageWidth.HasValue)
        {
            sb.Append(options.PageWidth.Value.ToString("G", inv));
        }
        else
        {
            sb.Append("null");
        }
        sb.Append(',');

        sb.Append("\"page_height\":");
        if (options.PageHeight.HasValue)
        {
            sb.Append(options.PageHeight.Value.ToString("G", inv));
        }
        else
        {
            sb.Append("null");
        }
        sb.Append(',');

        sb.Append("\"margin_top\":").Append(options.MarginTop.ToString("G", inv)).Append(',');
        sb.Append("\"margin_bottom\":").Append(options.MarginBottom.ToString("G", inv)).Append(',');
        sb.Append("\"margin_left\":").Append(options.MarginLeft.ToString("G", inv)).Append(',');
        sb.Append("\"margin_right\":").Append(options.MarginRight.ToString("G", inv)).Append(',');
        sb.Append("\"print_background\":").Append(options.PrintBackground ? "true" : "false").Append(',');
        sb.Append("\"scale\":").Append(options.Scale.ToString("G", inv));

        sb.Append('}');
        return sb.ToString();
    }

    private static void WriteNullableString(StringBuilder sb, string? value)
    {
        if (value == null)
        {
            sb.Append("null");
            return;
        }

        WriteString(sb, value);
    }

    private static void WriteString(StringBuilder sb, string value)
    {
        sb.Append('"');
        foreach (char c in value)
        {
            switch (c)
            {
                case '\\': sb.Append("\\\\"); break;
                case '"': sb.Append("\\\""); break;
                case '\n': sb.Append("\\n"); break;
                case '\r': sb.Append("\\r"); break;
                case '\t': sb.Append("\\t"); break;
                case '\b': sb.Append("\\b"); break;
                case '\f': sb.Append("\\f"); break;
                default:
                    if (c < 32)
                    {
                        sb.AppendFormat(CultureInfo.InvariantCulture, "\\u{0:x4}", (int)c);
                    }
                    else
                    {
                        sb.Append(c);
                    }
                    break;
            }
        }
        sb.Append('"');
    }
}
