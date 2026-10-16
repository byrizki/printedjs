using System;
using System.Threading.Tasks;
using PrintedJs.HeadlessWebView.Internal;
using Xunit;

namespace PrintedJs.HeadlessWebView.Tests;

public class HeadlessWebViewTests
{
    [Fact]
    public void PdfPrintOptions_DefaultValues_AreStandardA4()
    {
        var options = new PdfPrintOptions();

        Assert.False(options.Landscape);
        Assert.Equal(8.27, options.PageWidth);
        Assert.Equal(11.69, options.PageHeight);
        Assert.Equal(0.0, options.MarginTop);
        Assert.Equal(0.0, options.MarginBottom);
        Assert.Equal(0.0, options.MarginLeft);
        Assert.Equal(0.0, options.MarginRight);
        Assert.True(options.PrintBackground);
        Assert.Equal(1.0, options.Scale);
    }

    [Fact]
    public void PdfPrintOptions_CustomValues_SerializeCorrectly()
    {
        var options = new PdfPrintOptions
        {
            Landscape = true,
            PageWidth = 8.5,
            PageHeight = 11.0,
            MarginTop = 0.5,
            MarginBottom = 0.5,
            Scale = 1.2
        };

        string json = InternalJsonWriter.SerializePrintOptions(options);
        Assert.Contains("\"landscape\":true", json);
        Assert.Contains("\"page_width\":8.5", json);
        Assert.Contains("\"page_height\":11", json);
        Assert.Contains("\"margin_top\":0.5", json);
    }

    [Fact]
    public void WebViewConfig_Serialization_IncludesInitializationScripts()
    {
        var config = new WebViewConfig
        {
            Url = "https://printedjs.dev",
            InitializationScripts = new[] { "console.log('init')" },
            Transparent = true
        };

        string json = InternalJsonWriter.SerializeConfig(config);
        Assert.Contains("\"url\":\"https://printedjs.dev\"", json);
        Assert.Contains("\"transparent\":true", json);
        Assert.Contains("init", json);
    }

    [Fact]
    public void HeadlessWebViewException_CarriesErrorCode()
    {
        var ex = new HeadlessWebViewException("Custom error message", -42);

        Assert.Equal("Custom error message", ex.Message);
        Assert.Equal(-42, ex.ErrorCode);
    }
}
