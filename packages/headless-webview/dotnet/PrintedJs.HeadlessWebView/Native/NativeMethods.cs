using System;
using System.Runtime.InteropServices;

namespace PrintedJs.HeadlessWebView.Native;

internal static class NativeMethods
{
    private const string LibraryName = "headless_webview_core";

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
    internal static extern int headless_webview_create([MarshalAs(UnmanagedType.LPUTF8Str)] string? configJson, out IntPtr outHandle);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
    internal static extern void headless_webview_destroy(IntPtr handle);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
    internal static extern int headless_webview_load_html(IntPtr handle, [MarshalAs(UnmanagedType.LPUTF8Str)] string html);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
    internal static extern int headless_webview_load_url(IntPtr handle, [MarshalAs(UnmanagedType.LPUTF8Str)] string url);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
    internal static extern int headless_webview_eval(IntPtr handle, [MarshalAs(UnmanagedType.LPUTF8Str)] string script, out IntPtr outResult);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
    internal static extern int headless_webview_print_to_pdf(
        IntPtr handle,
        [MarshalAs(UnmanagedType.LPUTF8Str)] string? optionsJson,
        out IntPtr outBytes,
        out UIntPtr outLen);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
    internal static extern int headless_webview_print_to_pdf_file(
        IntPtr handle,
        [MarshalAs(UnmanagedType.LPUTF8Str)] string path,
        [MarshalAs(UnmanagedType.LPUTF8Str)] string? optionsJson);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
    internal static extern void headless_webview_free_bytes(IntPtr bytes, UIntPtr len);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
    internal static extern void headless_webview_free_string(IntPtr strPtr);

    [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
    internal static extern int headless_webview_get_last_error(out IntPtr outMsg);
}
