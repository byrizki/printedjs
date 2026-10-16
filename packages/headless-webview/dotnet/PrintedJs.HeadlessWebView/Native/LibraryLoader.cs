using System;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;

namespace PrintedJs.HeadlessWebView.Native;

internal static class LibraryLoader
{
    private static bool _initialized;
    private static readonly object Lock = new();

    internal static void EnsureLoaded()
    {
        if (_initialized) return;

        lock (Lock)
        {
            if (_initialized) return;

#if NET5_0_OR_GREATER || NETCOREAPP3_0_OR_GREATER
            NativeLibrary.SetDllImportResolver(typeof(LibraryLoader).Assembly, ResolveDllImport);
#endif
            _initialized = true;
        }
    }

#if NET5_0_OR_GREATER || NETCOREAPP3_0_OR_GREATER
    private static IntPtr ResolveDllImport(string libraryName, Assembly assembly, DllImportSearchPath? searchPath)
    {
        if (libraryName != "headless_webview_core")
        {
            return IntPtr.Zero;
        }

        string rid = GetCurrentRuntimeIdentifier();
        string extension = GetLibraryExtension();
        string prefix = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "" : "lib";
        string fileName = $"{prefix}{libraryName}{extension}";

        string baseDirectory = AppContext.BaseDirectory;

        // 1. Check runtimes/{rid}/native/
        string runtimePath = Path.Combine(baseDirectory, "runtimes", rid, "native", fileName);
        if (File.Exists(runtimePath) && NativeLibrary.TryLoad(runtimePath, out IntPtr handle))
        {
            return handle;
        }

        // 2. Check application base directory
        string directPath = Path.Combine(baseDirectory, fileName);
        if (File.Exists(directPath) && NativeLibrary.TryLoad(directPath, out handle))
        {
            return handle;
        }

        return IntPtr.Zero;
    }

    private static string GetCurrentRuntimeIdentifier()
    {
        string os = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "win" :
                    RuntimeInformation.IsOSPlatform(OSPlatform.OSX) ? "osx" : "linux";

        string arch = RuntimeInformation.ProcessArchitecture switch
        {
            Architecture.X64 => "x64",
            Architecture.Arm64 => "arm64",
            Architecture.X86 => "x86",
            Architecture.Arm => "arm",
            _ => "x64"
        };

        return $"{os}-{arch}";
    }

    private static string GetLibraryExtension()
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) return ".dll";
        if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX)) return ".dylib";
        return ".so";
    }
#endif
}
