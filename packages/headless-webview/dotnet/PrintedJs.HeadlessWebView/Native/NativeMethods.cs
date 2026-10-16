using System;
using System.Runtime.InteropServices;

namespace PrintedJs.HeadlessWebView.Native;

internal static class NativeMethods
{
    private const string LibraryName = "headless_webview_core";

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    internal static extern int headless_webview_create(string? configJson, out IntPtr outHandle);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
    internal static extern void headless_webview_destroy(IntPtr handle);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    internal static extern int headless_webview_load_html(IntPtr handle, string html);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    internal static extern int headless_webview_load_url(IntPtr handle, string url);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    internal static extern int headless_webview_eval(IntPtr handle, string script, out IntPtr outResult);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    internal static extern int headless_webview_print_to_pdf(
        IntPtr handle,
        string? optionsJson,
        out IntPtr outBytes,
        out UIntPtr outLen);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    internal static extern int headless_webview_print_to_pdf_file(
        IntPtr handle,
        string path,
        string? optionsJson);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
    internal static extern void headless_webview_free_bytes(IntPtr bytes, UIntPtr len);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
    internal static extern void headless_webview_free_string(IntPtr strPtr);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
    internal static extern int headless_webview_get_last_error(out IntPtr outMsg);
}
