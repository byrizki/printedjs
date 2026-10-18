# PrintedJs.HeadlessWebView

Cross-platform headless webview and vector PDF rendering runtime for .NET powered by Wry and OS-native web engines.

## Features
- **True Headless Rendering**: Windowless rendering using WebView2 (Windows), WebKitGTK (Linux), or WKWebView (macOS).
- **Direct-to-Vector PDF**: High-fidelity PDF generation without rasterization artifacts.
- **In-Memory & File Output**: Generate in-memory `byte[]` streams or atomic filesystem writes.
- **Async/Await**: Modern `Task`-based asynchronous API with cancellation support.

## Usage

```csharp
using PrintedJs.HeadlessWebView;

await using var webview = await HeadlessWebView.CreateAsync(new WebViewConfig
{
    Html = "<h1>Hello from PrintedJS Headless WebView!</h1>"
});

byte[] pdfBytes = await webview.PrintToPdfAsync(new PdfPrintOptions
{
    Landscape = false,
    PageWidth = 8.27,
    PageHeight = 11.69,
    PrintBackground = true
});

await File.WriteAllBytesAsync("document.pdf", pdfBytes);
```

## Linux & Docker Deployment

On Linux, `PrintedJs.HeadlessWebView` utilizes WebKitGTK and GTK 3. Because GTK requires an active display connection during initialization, headless environments (such as Docker containers or cloud VMs without an X/Wayland server) require a virtual framebuffer like **Xvfb**.

### Required System Packages (Debian / Ubuntu)

Install the runtime dependencies and standard web fonts:

```bash
apt-get update && apt-get install -y --no-install-recommends \
    libwebkit2gtk-4.1-0 \
    libgtk-3-0 \
    xvfb \
    fontconfig \
    fonts-liberation \
    ca-certificates
```

### Running in Docker

Wrap your application execution with `xvfb-run -a` or run Xvfb in the background.

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install WebKitGTK, GTK3, Xvfb, and system fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    libwebkit2gtk-4.1-0 \
    libgtk-3-0 \
    xvfb \
    fontconfig \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Disable hardware GPU probe inside container
ENV WEBKIT_DISABLE_COMPOSITING_MODE=1

COPY ./publish .

# Run with virtual framebuffer
ENTRYPOINT ["xvfb-run", "-a", "dotnet", "YourApp.dll"]
```

## License

MIT License © PrintedJS Contributors
