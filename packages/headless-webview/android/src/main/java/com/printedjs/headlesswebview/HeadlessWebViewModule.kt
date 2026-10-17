package com.printedjs.headlesswebview

import android.annotation.SuppressLint
import android.os.Handler
import android.os.Looper
import android.print.PrintAttributes
import android.util.Base64
import android.webkit.ValueCallback
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
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
    private val pendingNavigations = ConcurrentHashMap<String, MutableList<(Throwable?) -> Unit>>()
    private val navigationTimeouts = ConcurrentHashMap<String, Runnable>()
    private val loadingStates = ConcurrentHashMap<String, Boolean>()

    companion object {
        const val NAME = "HeadlessWebviewModule"
    }

    override fun getName(): String = NAME

    private fun dispatchNavigation(instanceId: String, error: Throwable? = null) {
        val timeoutRunnable = navigationTimeouts.remove(instanceId)
        if (timeoutRunnable != null) {
            mainHandler.removeCallbacks(timeoutRunnable)
        }
        loadingStates[instanceId] = false

        val callbacks = pendingNavigations.remove(instanceId) ?: return
        synchronized(callbacks) {
            for (cb in callbacks) {
                cb(error)
            }
        }
    }

    private fun waitForNavigation(instanceId: String, timeoutMs: Long = 15000L, completion: (Throwable?) -> Unit) {
        val list = pendingNavigations.getOrPut(instanceId) { mutableListOf() }
        synchronized(list) {
            list.add(completion)
        }

        if (!navigationTimeouts.containsKey(instanceId)) {
            val runnable = Runnable {
                dispatchNavigation(instanceId, RuntimeException("Navigation timed out after ${timeoutMs}ms"))
            }
            navigationTimeouts[instanceId] = runnable
            mainHandler.postDelayed(runnable, timeoutMs)
        }
    }

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

                webView.webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        dispatchNavigation(instanceId, null)
                    }

                    override fun onReceivedError(
                        view: WebView?,
                        request: WebResourceRequest?,
                        error: WebResourceError?
                    ) {
                        super.onReceivedError(view, request, error)
                        if (request?.isForMainFrame == true) {
                            val description = error?.description?.toString() ?: "Navigation failed"
                            dispatchNavigation(instanceId, RuntimeException(description))
                        }
                    }

                    @Suppress("DEPRECATION")
                    override fun onReceivedError(
                        view: WebView?,
                        errorCode: Int,
                        description: String?,
                        failingUrl: String?
                    ) {
                        super.onReceivedError(view, errorCode, description, failingUrl)
                        dispatchNavigation(instanceId, RuntimeException(description ?: "Navigation failed with code $errorCode"))
                    }
                }

                webviews[instanceId] = webView

                if (config.hasKey("html")) {
                    val html = config.getString("html") ?: ""
                    loadingStates[instanceId] = true
                    waitForNavigation(instanceId) { error ->
                        if (error != null) {
                            promise.reject("CREATE_ERROR", error.message, error)
                        } else {
                            promise.resolve(instanceId)
                        }
                    }
                    webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
                } else if (config.hasKey("url")) {
                    val url = config.getString("url") ?: ""
                    loadingStates[instanceId] = true
                    waitForNavigation(instanceId) { error ->
                        if (error != null) {
                            promise.reject("CREATE_ERROR", error.message, error)
                        } else {
                            promise.resolve(instanceId)
                        }
                    }
                    webView.loadUrl(url)
                } else {
                    promise.resolve(instanceId)
                }
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
            loadingStates[instanceId] = true
            waitForNavigation(instanceId) { error ->
                if (error != null) {
                    promise.reject("LOAD_ERROR", error.message, error)
                } else {
                    promise.resolve(null)
                }
            }
            webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
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
            loadingStates[instanceId] = true
            waitForNavigation(instanceId) { error ->
                if (error != null) {
                    promise.reject("LOAD_ERROR", error.message, error)
                } else {
                    promise.resolve(null)
                }
            }
            webView.loadUrl(url)
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

            val executeEval = {
                webView.evaluateJavascript(script) { result ->
                    promise.resolve(result ?: "")
                }
            }

            if (loadingStates[instanceId] == true) {
                waitForNavigation(instanceId) { error ->
                    if (error != null) {
                        promise.reject("EVAL_ERROR", error.message, error)
                    } else {
                        executeEval()
                    }
                }
            } else {
                executeEval()
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

            val executePrint = {
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

            if (loadingStates[instanceId] == true) {
                waitForNavigation(instanceId) { error ->
                    if (error != null) {
                        promise.reject("PDF_INIT_ERROR", error.message, error)
                    } else {
                        executePrint()
                    }
                }
            } else {
                executePrint()
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

            val executePrintFile = {
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

            if (loadingStates[instanceId] == true) {
                waitForNavigation(instanceId) { error ->
                    if (error != null) {
                        promise.reject("PDF_INIT_ERROR", error.message, error)
                    } else {
                        executePrintFile()
                    }
                }
            } else {
                executePrintFile()
            }
        }
    }

    @ReactMethod
    fun destroyInstance(instanceId: String, promise: Promise) {
        mainHandler.post {
            val timeoutRunnable = navigationTimeouts.remove(instanceId)
            if (timeoutRunnable != null) {
                mainHandler.removeCallbacks(timeoutRunnable)
            }
            pendingNavigations.remove(instanceId)
            loadingStates.remove(instanceId)

            val webView = webviews.remove(instanceId)
            webView?.stopLoading()
            webView?.webViewClient = WebViewClient()
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
