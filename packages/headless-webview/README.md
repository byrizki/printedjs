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

## 1. React Native (iOS, Android & Desktop)

### Platform Support Matrix

`@printedjs/headless-webview` provides unified headless WebView execution and vector PDF generation across mobile and desktop React Native targets without needing browser daemons or emulators:

| Target Platform           | Underlying Web Engine                        | RN Architecture Support                  | PDF Output Format       | Headless Execution | Prebuilt Binary Bundled              |
| :------------------------ | :------------------------------------------- | :--------------------------------------- | :---------------------- | :----------------- | :----------------------------------- |
| **iOS** (`>= 12.0`)       | `WKWebView` (`createPDF`)                    | TurboModule (New Arch) & Bridge (Legacy) | Vector PDF (`%PDF-1.4`) | Offscreen View     | Built into iOS WebKit                |
| **Android** (`>= API 24`) | `android.webkit.WebView` (`PrintAttributes`) | TurboModule (New Arch) & Bridge (Legacy) | Vector PDF (`%PDF-1.4`) | Offscreen View     | Built into Android WebView           |
| **macOS Desktop**         | Wry (`WebKit`)                               | Desktop Native Bridge                    | Vector PDF (`%PDF-1.4`) | Native Headless    | `bin/darwin-arm64`, `bin/darwin-x64` |
| **Windows Desktop**       | Wry (`WebView2`)                             | Desktop Native Bridge                    | Vector PDF (`%PDF-1.4`) | Native Headless    | `bin/win32-x64`                      |
| **Linux Desktop**         | Wry (`WebKitGTK`)                            | Desktop Native Bridge                    | Vector PDF (`%PDF-1.4`) | Native Headless    | `bin/linux-x64`                      |

### Installation

```bash
pnpm add @printedjs/headless-webview
# or
npm install @printedjs/headless-webview
```

#### iOS Setup

For CocoaPods:

```bash
cd ios && pod install
```

Swift Package Manager (`Package.swift`) is also supported out of the box with zero manual configuration.

#### Android Setup

Autolinking automatically registers `HeadlessWebViewPackage`. Ensure your `android/build.gradle` defines `minSdkVersion = 24`.

#### React Native Desktop (macOS, Windows, Linux)

Prebuilt native binaries are bundled directly under `bin/` inside the npm package. Call `enableDesktopBridge()` to activate the native Wry engine:

```ts
import { enableDesktopBridge, HeadlessWebView } from "@printedjs/headless-webview";

// Automatically binds HeadlessWebView to the bundled prebuilt native desktop binary
enableDesktopBridge();

const webview = await HeadlessWebView.create({
	html: "<h1>Desktop Vector PDF</h1>",
});
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
	printBackground: true,
});

// Cleanup instance
await webview.destroy();
```

### Example Application & Test Harness

A complete React Native example application is located in [`example/`](example/):

- **Run on Desktop**: `pnpm --filter headless-webview-example desktop`
- **Run on Android (Legacy)**: `pnpm --filter headless-webview-example android:legacy`
- **Run on Android (New Arch)**: `pnpm --filter headless-webview-example android:new-arch`
- **Run on iOS (Legacy)**: `pnpm --filter headless-webview-example ios:legacy`
- **Run on iOS (New Arch)**: `pnpm --filter headless-webview-example ios:new-arch`
- **Run Packaging & Architecture Suite**: `pnpm --filter headless-webview-example test:both-arch`

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
