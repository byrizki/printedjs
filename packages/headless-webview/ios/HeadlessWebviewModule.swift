import Foundation
import UIKit
import WebKit
import React

@objc(HeadlessWebviewModule)
public class HeadlessWebviewModule: NSObject, WKNavigationDelegate {
    private var webviews: [String: WKWebView] = [:]
    private var navigationResolvers: [String: () -> Void] = [:]
    
    @objc
    public static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc(createInstance:resolver:rejecter:)
    public func createInstance(
        _ config: [String: Any],
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            let instanceId = UUID().uuidString
            let configuration = WKWebViewConfiguration()

            if let scripts = config["initializationScripts"] as? [String] {
                for script in scripts {
                    let userScript = WKUserScript(
                        source: script,
                        injectionTime: .atDocumentStart,
                        forMainFrameOnly: true
                    )
                    configuration.userContentController.addUserScript(userScript)
                }
            }

            // Headless: zero frame, not added to any view hierarchy
            let webview = WKWebView(frame: .zero, configuration: configuration)
            webview.navigationDelegate = self

            if let transparent = config["transparent"] as? Bool, transparent {
                webview.isOpaque = false
                webview.backgroundColor = .clear
                webview.scrollView.backgroundColor = .clear
            }

            if let userAgent = config["userAgent"] as? String {
                webview.customUserAgent = userAgent
            }

            self.webviews[instanceId] = webview

            if let html = config["html"] as? String {
                webview.loadHTMLString(html, baseURL: nil)
            } else if let urlString = config["url"] as? String, let url = URL(string: urlString) {
                webview.load(URLRequest(url: url))
            }

            resolver(instanceId)
        }
    }

    @objc(loadHtml:html:resolver:rejecter:)
    public func loadHtml(
        _ instanceId: String,
        html: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let webview = self?.webviews[instanceId] else {
                rejecter("NOT_FOUND", "Headless webview instance not found: \(instanceId)", nil)
                return
            }
            webview.loadHTMLString(html, baseURL: nil)
            resolver(nil)
        }
    }

    @objc(loadUrl:url:resolver:rejecter:)
    public func loadUrl(
        _ instanceId: String,
        url: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let webview = self?.webviews[instanceId] else {
                rejecter("NOT_FOUND", "Headless webview instance not found: \(instanceId)", nil)
                return
            }
            guard let requestUrl = URL(string: url) else {
                rejecter("INVALID_URL", "Invalid URL: \(url)", nil)
                return
            }
            webview.load(URLRequest(url: requestUrl))
            resolver(nil)
        }
    }

    @objc(evalScript:script:resolver:rejecter:)
    public func evalScript(
        _ instanceId: String,
        script: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let webview = self?.webviews[instanceId] else {
                rejecter("NOT_FOUND", "Headless webview instance not found: \(instanceId)", nil)
                return
            }
            webview.evaluateJavaScript(script) { result, error in
                if let error = error {
                    rejecter("EVAL_ERROR", error.localizedDescription, error)
                } else {
                    resolver(String(describing: result ?? ""))
                }
            }
        }
    }

    @objc(printToPdf:options:resolver:rejecter:)
    public func printToPdf(
        _ instanceId: String,
        options: [String: Any],
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let webview = self?.webviews[instanceId] else {
                rejecter("NOT_FOUND", "Headless webview instance not found: \(instanceId)", nil)
                return
            }

            if #available(iOS 14.0, *) {
                let pdfConfig = WKPDFConfiguration()
                // A4 dimensions in points: 595.28 x 841.89
                let width = (options["pageWidth"] as? Double ?? 8.27) * 72.0
                let height = (options["pageHeight"] as? Double ?? 11.69) * 72.0
                let landscape = options["landscape"] as? Bool ?? false
                
                pdfConfig.rect = CGRect(
                    x: 0,
                    y: 0,
                    width: landscape ? height : width,
                    height: landscape ? width : height
                )

                webview.createPDF(configuration: pdfConfig) { result in
                    switch result {
                    case .success(let data):
                        let base64String = data.base64EncodedString()
                        resolver(base64String)
                    case .failure(let error):
                        rejecter("PDF_ERROR", error.localizedDescription, error)
                    }
                }
            } else if let self = self {
                let data = self.renderPdfLegacy(webview: webview, options: options)
                let base64String = data.base64EncodedString()
                resolver(base64String)
            }
        }
    }

    @objc(printToPdfFile:filePath:options:resolver:rejecter:)
    public func printToPdfFile(
        _ instanceId: String,
        filePath: String,
        options: [String: Any],
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let webview = self?.webviews[instanceId] else {
                rejecter("NOT_FOUND", "Headless webview instance not found: \(instanceId)", nil)
                return
            }

            if #available(iOS 14.0, *) {
                let pdfConfig = WKPDFConfiguration()
                let width = (options["pageWidth"] as? Double ?? 8.27) * 72.0
                let height = (options["pageHeight"] as? Double ?? 11.69) * 72.0
                let landscape = options["landscape"] as? Bool ?? false

                pdfConfig.rect = CGRect(
                    x: 0,
                    y: 0,
                    width: landscape ? height : width,
                    height: landscape ? width : height
                )

                webview.createPDF(configuration: pdfConfig) { result in
                    switch result {
                    case .success(let data):
                        do {
                            let fileUrl = URL(fileURLWithPath: filePath)
                            let parentDir = fileUrl.deletingLastPathComponent()
                            try FileManager.default.createDirectory(at: parentDir, withIntermediateDirectories: true)
                            try data.write(to: fileUrl)
                            resolver(nil)
                        } catch {
                            rejecter("IO_ERROR", error.localizedDescription, error)
                        }
                    case .failure(let error):
                        rejecter("PDF_ERROR", error.localizedDescription, error)
                    }
                }
            } else if let self = self {
                let data = self.renderPdfLegacy(webview: webview, options: options)
                do {
                    let fileUrl = URL(fileURLWithPath: filePath)
                    let parentDir = fileUrl.deletingLastPathComponent()
                    try FileManager.default.createDirectory(at: parentDir, withIntermediateDirectories: true)
                    try data.write(to: fileUrl)
                    resolver(nil)
                } catch {
                    rejecter("IO_ERROR", error.localizedDescription, error)
                }
            }
        }
    }

    private func renderPdfLegacy(webview: WKWebView, options: [String: Any]) -> Data {
        let width = (options["pageWidth"] as? Double ?? 8.27) * 72.0
        let height = (options["pageHeight"] as? Double ?? 11.69) * 72.0
        let landscape = options["landscape"] as? Bool ?? false

        let pageRect = CGRect(
            x: 0,
            y: 0,
            width: landscape ? height : width,
            height: landscape ? width : height
        )

        webview.frame = pageRect

        let printFormatter = webview.viewPrintFormatter()
        let renderer = UIPrintPageRenderer()
        renderer.addPrintFormatter(printFormatter, startingAtPageAt: 0)
        renderer.setValue(pageRect, forKey: "paperRect")
        renderer.setValue(pageRect, forKey: "printableRect")

        let pdfData = NSMutableData()
        UIGraphicsBeginPDFContextToData(pdfData, pageRect, nil)
        for i in 0..<renderer.numberOfPages {
            UIGraphicsBeginPDFPage()
            renderer.drawPage(at: i, in: UIGraphicsGetPDFContextBounds())
        }
        UIGraphicsEndPDFContext()

        return pdfData as Data
    }

    @objc(destroyInstance:resolver:rejecter:)
    public func destroyInstance(
        _ instanceId: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async { [weak self] in
            self?.webviews.removeValue(forKey: instanceId)
            resolver(nil)
        }
    }
}
