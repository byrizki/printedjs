package com.printedjs.headlesswebview

import android.annotation.SuppressLint
import android.os.Handler
import android.os.Looper
import android.print.PrintAttributes
import android.util.Base64
import android.webkit.ValueCallback
import android.webkit.WebSettings
import android.webkit.WebView
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.io.File
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

@SuppressLint("SetJavaScriptEnabled")
class HeadlessWebViewModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val mainHandler = Handler(Looper.getMainLooper())
    private val webviews = ConcurrentHashMap<String, WebView>()

    companion object {
        const val NAME = "HeadlessWebviewModule"
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun createInstance(config: ReadableMap, promise: Promise) {
        mainHandler.post {
            try {
                val instanceId = UUID.randomUUID().toString()
                val webView = WebView(reactApplicationContext)
                val settings = webView.settings

                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.databaseEnabled = true
                settings.mediaPlaybackRequiresUserGesture = false

                if (config.hasKey("userAgent")) {
                    settings.userAgentString = config.getString("userAgent")
                }

                if (config.hasKey("transparent") && config.getBoolean("transparent")) {
                    webView.setBackgroundColor(0)
                }

                webviews[instanceId] = webView

                if (config.hasKey("html")) {
                    val html = config.getString("html") ?: ""
                    webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
                } else if (config.hasKey("url")) {
                    val url = config.getString("url") ?: ""
                    webView.loadUrl(url)
                }

                promise.resolve(instanceId)
            } catch (e: Exception) {
                promise.reject("CREATE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun loadHtml(instanceId: String, html: String, promise: Promise) {
        mainHandler.post {
            val webView = webviews[instanceId]
            if (webView == null) {
                promise.reject("NOT_FOUND", "Headless webview instance not found: $instanceId")
                return@post
            }
            webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun loadUrl(instanceId: String, url: String, promise: Promise) {
        mainHandler.post {
            val webView = webviews[instanceId]
            if (webView == null) {
                promise.reject("NOT_FOUND", "Headless webview instance not found: $instanceId")
                return@post
            }
            webView.loadUrl(url)
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun evalScript(instanceId: String, script: String, promise: Promise) {
        mainHandler.post {
            val webView = webviews[instanceId]
            if (webView == null) {
                promise.reject("NOT_FOUND", "Headless webview instance not found: $instanceId")
                return@post
            }
            webView.evaluateJavascript(script) { result ->
                promise.resolve(result ?: "")
            }
        }
    }

    @ReactMethod
    fun printToPdf(instanceId: String, options: ReadableMap, promise: Promise) {
        mainHandler.post {
            val webView = webviews[instanceId]
            if (webView == null) {
                promise.reject("NOT_FOUND", "Headless webview instance not found: $instanceId")
                return@post
            }

            try {
                val printAttributes = buildPrintAttributes(options)
                val adapter = webView.createPrintDocumentAdapter("headless_pdf")
                val tempFile = File.createTempFile("headless_pdf_", ".pdf", reactApplicationContext.cacheDir)
                val helper = android.print.PdfPrintHelper(printAttributes)

                helper.print(
                    adapter,
                    tempFile,
                    onSuccess = {
                        Thread {
                            try {
                                val bytes = tempFile.readBytes()
                                tempFile.delete()
                                val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                                promise.resolve(base64)
                            } catch (e: Exception) {
                                tempFile.delete()
                                promise.reject("PDF_READ_ERROR", e.message, e)
                            }
                        }.start()
                    },
                    onError = { throwable ->
                        tempFile.delete()
                        promise.reject("PDF_PRINT_ERROR", throwable.message, throwable)
                    }
                )
            } catch (e: Exception) {
                promise.reject("PDF_INIT_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun printToPdfFile(instanceId: String, filePath: String, options: ReadableMap, promise: Promise) {
        mainHandler.post {
            val webView = webviews[instanceId]
            if (webView == null) {
                promise.reject("NOT_FOUND", "Headless webview instance not found: $instanceId")
                return@post
            }

            try {
                val printAttributes = buildPrintAttributes(options)
                val adapter = webView.createPrintDocumentAdapter("headless_pdf")
                val targetFile = File(filePath)
                targetFile.parentFile?.mkdirs()
                val helper = android.print.PdfPrintHelper(printAttributes)

                helper.print(
                    adapter,
                    targetFile,
                    onSuccess = {
                        promise.resolve(null)
                    },
                    onError = { throwable ->
                        promise.reject("PDF_FILE_WRITE_ERROR", throwable.message, throwable)
                    }
                )
            } catch (e: Exception) {
                promise.reject("PDF_INIT_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun destroyInstance(instanceId: String, promise: Promise) {
        mainHandler.post {
            val webView = webviews.remove(instanceId)
            webView?.destroy()
            promise.resolve(null)
        }
    }

    private fun buildPrintAttributes(options: ReadableMap): PrintAttributes {
        val landscape = options.hasKey("landscape") && options.getBoolean("landscape")
        val pageWidth = if (options.hasKey("pageWidth")) options.getDouble("pageWidth") else 8.27
        val pageHeight = if (options.hasKey("pageHeight")) options.getDouble("pageHeight") else 11.69

        val mediaSize = if (pageWidth > 0 && pageHeight > 0) {
            val wMils = (pageWidth * 1000).toInt()
            val hMils = (pageHeight * 1000).toInt()
            PrintAttributes.MediaSize("custom", "Custom", wMils, hMils)
        } else if (landscape) {
            PrintAttributes.MediaSize.ISO_A4.asLandscape()
        } else {
            PrintAttributes.MediaSize.ISO_A4.asPortrait()
        }

        val marginTop = if (options.hasKey("marginTop")) options.getDouble("marginTop") else 0.0
        val marginBottom = if (options.hasKey("marginBottom")) options.getDouble("marginBottom") else 0.0
        val marginLeft = if (options.hasKey("marginLeft")) options.getDouble("marginLeft") else 0.0
        val marginRight = if (options.hasKey("marginRight")) options.getDouble("marginRight") else 0.0

        val margins = PrintAttributes.Margins(
            (marginLeft * 1000).toInt(),
            (marginTop * 1000).toInt(),
            (marginRight * 1000).toInt(),
            (marginBottom * 1000).toInt()
        )

        return PrintAttributes.Builder()
            .setMediaSize(mediaSize)
            .setResolution(PrintAttributes.Resolution("pdf", "pdf", 300, 300))
            .setMinMargins(margins)
            .build()
    }
}
