// swift-tools-version: 5.9
import PackageDescription

let package = Package(
  name: "react-native-headless-webview",
  platforms: [
    .iOS(.v12),
    .macOS(.v11)
  ],
  products: [
    .library(
      name: "HeadlessWebView",
      targets: ["HeadlessWebView"]
    )
  ],
  dependencies: [],
  targets: [
    .target(
      name: "HeadlessWebView",
      dependencies: [],
      path: "ios",
      sources: [
        "HeadlessWebviewModule.swift",
        "HeadlessWebviewModuleBridge.m"
      ],
      publicHeadersPath: "."
    )
  ]
)
