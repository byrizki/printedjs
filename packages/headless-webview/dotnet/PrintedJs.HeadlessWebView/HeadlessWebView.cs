using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using PrintedJs.HeadlessWebView.Internal;
using PrintedJs.HeadlessWebView.Native;

namespace PrintedJs.HeadlessWebView;

public class HeadlessWebView : IHeadlessWebView
{
    private IntPtr _handle;
    private bool _isDisposed;

    private HeadlessWebView(IntPtr handle)
    {
        _handle = handle;
    }

    public static Task<HeadlessWebView> CreateAsync(
        WebViewConfig? config = null, 
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        LibraryLoader.EnsureLoaded();

        string? configJson = config != null ? InternalJsonWriter.SerializeConfig(config) : null;
        int status = NativeMethods.headless_webview_create(configJson, out IntPtr handle);

        if (status != 0 || handle == IntPtr.Zero)
        {
            string error = GetLastNativeError() ?? $"Failed to initialize headless webview (code {status})";
            throw new HeadlessWebViewException(error, status);
        }

        return Task.FromResult(new HeadlessWebView(handle));
    }

    public Task LoadHtmlAsync(string html, CancellationToken cancellationToken = default)
    {
        ThrowIfDisposed();
        cancellationToken.ThrowIfCancellationRequested();

        if (html == null) throw new ArgumentNullException(nameof(html));

        int status = NativeMethods.headless_webview_load_html(_handle, html);
        if (status != 0)
        {
            string error = GetLastNativeError() ?? $"Failed to load HTML (code {status})";
            throw new HeadlessWebViewException(error, status);
        }

        return Task.CompletedTask;
    }

    public Task LoadUrlAsync(string url, CancellationToken cancellationToken = default)
    {
        ThrowIfDisposed();
        cancellationToken.ThrowIfCancellationRequested();

        if (url == null) throw new ArgumentNullException(nameof(url));

        int status = NativeMethods.headless_webview_load_url(_handle, url);
        if (status != 0)
        {
            string error = GetLastNativeError() ?? $"Failed to load URL (code {status})";
            throw new HeadlessWebViewException(error, status);
        }

        return Task.CompletedTask;
    }

    public Task<string> EvaluateJavascriptAsync(string script, CancellationToken cancellationToken = default)
    {
        ThrowIfDisposed();
        cancellationToken.ThrowIfCancellationRequested();

        if (script == null) throw new ArgumentNullException(nameof(script));

        int status = NativeMethods.headless_webview_eval(_handle, script, out IntPtr outResult);
        if (status != 0 || outResult == IntPtr.Zero)
        {
            string error = GetLastNativeError() ?? $"Failed to evaluate script (code {status})";
            throw new HeadlessWebViewException(error, status);
        }

        try
        {
            string result = Marshal.PtrToStringAnsi(outResult) ?? string.Empty;
            return Task.FromResult(result);
        }
        finally
        {
            NativeMethods.headless_webview_free_string(outResult);
        }
    }

    public Task<byte[]> PrintToPdfAsync(PdfPrintOptions? options = null, CancellationToken cancellationToken = default)
    {
        ThrowIfDisposed();
        cancellationToken.ThrowIfCancellationRequested();

        string? optionsJson = options != null ? InternalJsonWriter.SerializePrintOptions(options) : null;
        int status = NativeMethods.headless_webview_print_to_pdf(
            _handle, 
            optionsJson, 
            out IntPtr outBytes, 
            out UIntPtr outLen);

        if (status != 0 || outBytes == IntPtr.Zero)
        {
            string error = GetLastNativeError() ?? $"Failed to generate PDF (code {status})";
            throw new HeadlessWebViewException(error, status);
        }

        try
        {
            int length = (int)outLen.ToUInt32();
            byte[] bytes = new byte[length];
            Marshal.Copy(outBytes, bytes, 0, length);
            return Task.FromResult(bytes);
        }
        finally
        {
            NativeMethods.headless_webview_free_bytes(outBytes, outLen);
        }
    }

    public Task PrintToPdfFileAsync(
        string outputPath, 
        PdfPrintOptions? options = null, 
        CancellationToken cancellationToken = default)
    {
        ThrowIfDisposed();
        cancellationToken.ThrowIfCancellationRequested();

        if (outputPath == null) throw new ArgumentNullException(nameof(outputPath));

        string? optionsJson = options != null ? InternalJsonWriter.SerializePrintOptions(options) : null;
        int status = NativeMethods.headless_webview_print_to_pdf_file(_handle, outputPath, optionsJson);

        if (status != 0)
        {
            string error = GetLastNativeError() ?? $"Failed to write PDF to file (code {status})";
            throw new HeadlessWebViewException(error, status);
        }

        return Task.CompletedTask;
    }

    public void Dispose()
    {
        if (_isDisposed) return;
        _isDisposed = true;

        if (_handle != IntPtr.Zero)
        {
            NativeMethods.headless_webview_destroy(_handle);
            _handle = IntPtr.Zero;
        }

        GC.SuppressFinalize(this);
    }

    public ValueTask DisposeAsync()
    {
        Dispose();
        return default;
    }

    private void ThrowIfDisposed()
    {
        if (_isDisposed)
        {
            throw new ObjectDisposedException(nameof(HeadlessWebView));
        }
    }

    private static string? GetLastNativeError()
    {
        if (NativeMethods.headless_webview_get_last_error(out IntPtr outMsg) == 0 && outMsg != IntPtr.Zero)
        {
            try
            {
                return Marshal.PtrToStringAnsi(outMsg);
            }
            finally
            {
                NativeMethods.headless_webview_free_string(outMsg);
            }
        }
        return null;
    }

    ~HeadlessWebView()
    {
        Dispose();
    }
}
