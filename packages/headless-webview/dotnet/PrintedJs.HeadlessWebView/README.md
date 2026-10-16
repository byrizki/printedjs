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

MIT License © PrintedJS Contributors
