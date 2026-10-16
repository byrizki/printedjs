# @printedjs/headless-webview

Cross-platform headless WebView and vector PDF rendering runtime for **React Native** (iOS & Android) and **.NET** (NuGet), powered by **Wry** and **UniFFI**.

---

## Architecture Overview

```text
packages/headless-webview/
├── crates/
│   ├── vendor/wry-headless/     # Git submodule vendored crates (byrizki/wry-headless)
│   └── headless-webview-core/   # Rust native core with UniFFI and Wry integration
│       ├── src/headless_webview.udl # UniFFI Definition Language interface
│       ├── src/engine.rs        # Headless webview engine wrapping Wry
│       └── src/ffi.rs           # C-ABI exports for .NET P/Invoke
├── src/                         # TypeScript / React Native layer
│   ├── hooks/useHeadlessWebView.ts # React / React Native hook
│   ├── services/HeadlessWebViewService.ts # High-level HeadlessWebView class
│   └── native/NativeHeadlessWebView.ts    # NativeModule bridge
├── ios/                         # React Native iOS NativeModule (WebKit createPDF)
├── android/                     # React Native Android NativeModule (PrintDocumentAdapter)
└── dotnet/                      # .NET NuGet package (PrintedJs.HeadlessWebView)
    ├── PrintedJs.HeadlessWebView/
    └── tests/PrintedJs.HeadlessWebView.Tests/
```

---

## 1. React Native (iOS & Android)

### Installation

```bash
pnpm add @printedjs/headless-webview
# or
npm install @printedjs/headless-webview
```

For iOS:

```bash
cd ios && pod install
```

### React Hook Usage

```tsx
import React from "react";
import { View, Button, Text } from "react-native";
import { useHeadlessWebView } from "@printedjs/headless-webview";

export const PdfExporterComponent = () => {
	const { isReady, loadHtml, printToPdf } = useHeadlessWebView({
		html: "<h1>Hello from PrintedJS Headless WebView!</h1>",
	});

	const handleExport = async () => {
		if (!isReady) return;
		const pdfBytes = await printToPdf({
			landscape: false,
			pageWidth: 8.27, // A4 width (inches)
			pageHeight: 11.69, // A4 height (inches)
			printBackground: true,
		});
		console.log(`Generated PDF size: ${pdfBytes.length} bytes`);
	};

	return (
		<View>
			<Text>Headless WebView Ready: {isReady ? "Yes" : "No"}</Text>
			<Button title="Export PDF" onPress={handleExport} disabled={!isReady} />
		</View>
	);
};
```

### Standalone Service Usage

```ts
import { HeadlessWebView } from "@printedjs/headless-webview";

const webview = await HeadlessWebView.create({
	url: "https://example.com",
});

// Evaluate JavaScript
const title = await webview.evaluateJavascript("document.title");

// Print directly to file
await webview.printToPdfFile("/path/to/document.pdf", {
	landscape: false,
});

// Cleanup instance
await webview.destroy();
```

---

## 2. .NET / NuGet (`PrintedJs.HeadlessWebView`)

### Package Details

- **Package ID**: `PrintedJs.HeadlessWebView`
- **Target Framework**: `netstandard2.1` (compatible with .NET Core 3.0+, .NET 5/6/7/8/9+, MAUI, and Unity)

### Installation

```bash
dotnet add package PrintedJs.HeadlessWebView
```

### C# Usage

```csharp
using System;
using System.IO;
using System.Threading.Tasks;
using PrintedJs.HeadlessWebView;

class Program
{
    static async Task Main()
    {
        await using var webview = await HeadlessWebView.CreateAsync(new WebViewConfig
        {
            Html = "<html><body><h1>Report</h1><p>Rendered headlessly.</p></body></html>"
        });

        // Print to in-memory byte array
        byte[] pdfBytes = await webview.PrintToPdfAsync(new PdfPrintOptions
        {
            Landscape = false,
            PageWidth = 8.27,
            PageHeight = 11.69,
            PrintBackground = true
        });

        await File.WriteAllBytesAsync("report.pdf", pdfBytes);

        // Or print directly to output path
        await webview.PrintToPdfFileAsync("output.pdf");
    }
}
```

---

## 3. Building and Verification

### Building TypeScript / React Native package

```bash
pnpm --filter @printedjs/headless-webview build
pnpm --filter @printedjs/headless-webview typecheck
```

### Building Rust Core (UniFFI & Wry)

```bash
# Android target
cargo check --manifest-path packages/headless-webview/crates/headless-webview-core/Cargo.toml --target aarch64-linux-android

# Windows target
cargo check --manifest-path packages/headless-webview/crates/headless-webview-core/Cargo.toml --target x86_64-pc-windows-msvc
```

### Building & Testing .NET package

```bash
dotnet build packages/headless-webview/dotnet/PrintedJs.HeadlessWebView/PrintedJs.HeadlessWebView.csproj
dotnet test packages/headless-webview/dotnet/tests/PrintedJs.HeadlessWebView.Tests/PrintedJs.HeadlessWebView.Tests.csproj
```

---

## License

MIT © PrintedJS Contributors
