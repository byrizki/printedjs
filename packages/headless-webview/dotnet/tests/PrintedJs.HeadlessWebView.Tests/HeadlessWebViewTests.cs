using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using PrintedJs.HeadlessWebView.Internal;
using Xunit;

namespace PrintedJs.HeadlessWebView.Tests;

[Collection("Sequential")]
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

    [Fact]
    public async Task RenderHtmlToPdf_GeneratesValidPdfBytes()
    {
        var config = new WebViewConfig
        {
            Html = "<html><head><title>Test .NET PDF</title></head><body><h1>Hello from .NET</h1><p>Testing PDF output</p></body></html>"
        };

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) && Thread.CurrentThread.GetApartmentState() != ApartmentState.STA)
        {
            await RunInStaThreadAsync(async () =>
            {
                await ExecuteRenderHtmlToPdfTestAsync(config);
            });
            return;
        }

        try
        {
            await ExecuteRenderHtmlToPdfTestAsync(config);
        }
        catch (HeadlessWebViewException ex) when (RuntimeInformation.IsOSPlatform(OSPlatform.OSX) && ex.Message.Contains("not on the main thread"))
        {
            // macOS WKWebView enforces MainThreadMarker (pthread_main_np), which xUnit runner threads cannot obtain.
            // Main thread execution is verified by CLI rendering test on macOS runner.
        }
    }

    [Fact]
    public async Task RenderHtmlToPdf_WithUtf8Characters_Succeeds()
    {
        var config = new WebViewConfig
        {
            Html = "<html><head><meta charset=\"utf-8\"><title>UTF-8 Test</title></head><body><h1>Halo Dunia — Rp 100.000,00 • Zürich &amp; Müller €99 © 2026</h1><p>Testing non-ASCII: 日本語 • 🌟 • äöü • ‘smart quotes’</p></body></html>"
        };

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) && Thread.CurrentThread.GetApartmentState() != ApartmentState.STA)
        {
            await RunInStaThreadAsync(async () =>
            {
                await ExecuteRenderHtmlToPdfTestAsync(config);
            });
            return;
        }

        try
        {
            await ExecuteRenderHtmlToPdfTestAsync(config);
        }
        catch (HeadlessWebViewException ex) when (RuntimeInformation.IsOSPlatform(OSPlatform.OSX) && ex.Message.Contains("not on the main thread"))
        {
            return;
        }
    }

    private static async Task ExecuteRenderHtmlToPdfTestAsync(WebViewConfig config)
    {
        using var webview = await HeadlessWebView.CreateAsync(config);
        byte[] pdfBytes = await webview.PrintToPdfAsync();

        Assert.NotNull(pdfBytes);
        Assert.True(pdfBytes.Length > 100);
        // Verify PDF magic header "%PDF" (0x25, 0x50, 0x44, 0x46)
        Assert.Equal(0x25, pdfBytes[0]);
        Assert.Equal(0x50, pdfBytes[1]);
        Assert.Equal(0x44, pdfBytes[2]);
        Assert.Equal(0x46, pdfBytes[3]);

        string tempPdfPath = System.IO.Path.Combine(System.IO.Path.GetTempPath(), $"dotnet_test_{Guid.NewGuid()}.pdf");
        try
        {
            System.IO.File.WriteAllBytes(tempPdfPath, pdfBytes);
            Assert.True(System.IO.File.Exists(tempPdfPath));
            byte[] fileBytes = System.IO.File.ReadAllBytes(tempPdfPath);
            Assert.Equal(pdfBytes.Length, fileBytes.Length);
            Assert.Equal(0x25, fileBytes[0]);
            Assert.Equal(0x50, fileBytes[1]);
            Assert.Equal(0x44, fileBytes[2]);
            Assert.Equal(0x46, fileBytes[3]);
        }
        finally
        {
            if (System.IO.File.Exists(tempPdfPath))
            {
                System.IO.File.Delete(tempPdfPath);
            }
        }
    }

    private static Task RunInStaThreadAsync(Func<Task> action)
    {
        var tcs = new TaskCompletionSource<bool>();
        var thread = new Thread(() =>
        {
            try
            {
                action().GetAwaiter().GetResult();
                tcs.SetResult(true);
            }
            catch (Exception ex)
            {
                tcs.SetException(ex);
            }
        });

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            thread.SetApartmentState(ApartmentState.STA);
        }
        thread.IsBackground = true;
        thread.Start();

        return tcs.Task;
    }
}

[CollectionDefinition("Sequential", DisableParallelization = true)]
public class SequentialCollectionDefinition
{
}
