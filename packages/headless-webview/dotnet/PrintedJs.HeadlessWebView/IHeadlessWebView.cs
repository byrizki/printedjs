using System;
using System.Threading;
using System.Threading.Tasks;

namespace PrintedJs.HeadlessWebView;

public interface IHeadlessWebView : IAsyncDisposable, IDisposable
{
    Task LoadHtmlAsync(string html, CancellationToken cancellationToken = default);

    Task LoadUrlAsync(string url, CancellationToken cancellationToken = default);

    Task<string> EvaluateJavascriptAsync(string script, CancellationToken cancellationToken = default);

    Task<byte[]> PrintToPdfAsync(PdfPrintOptions? options = null, CancellationToken cancellationToken = default);

    Task PrintToPdfFileAsync(string outputPath, PdfPrintOptions? options = null, CancellationToken cancellationToken = default);
}
