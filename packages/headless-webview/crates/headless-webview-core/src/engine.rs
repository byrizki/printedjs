use std::sync::{Arc, Mutex};
use std::time::Duration;
use crate::config::WebViewConfig;
use crate::error::HeadlessWebViewError;
use crate::options::PdfPrintOptions;

#[derive(uniffi::Object)]
pub struct HeadlessWebViewCore {
    #[cfg(any(
        target_os = "windows",
        target_vendor = "apple",
        target_os = "android",
        all(target_os = "linux", feature = "os-webview")
    ))]
    inner: Arc<Mutex<wry::WebView>>,
    #[cfg(not(any(
        target_os = "windows",
        target_vendor = "apple",
        target_os = "android",
        all(target_os = "linux", feature = "os-webview")
    )))]
    _marker: std::marker::PhantomData<()>,
}

unsafe impl Send for HeadlessWebViewCore {}
unsafe impl Sync for HeadlessWebViewCore {}

// UniFFI Object implementation
#[uniffi::export]
impl HeadlessWebViewCore {
    #[uniffi::constructor]
    pub fn new(config: WebViewConfig) -> Result<Arc<Self>, HeadlessWebViewError> {
        #[cfg(any(
            target_os = "windows",
            target_vendor = "apple",
            target_os = "android",
            all(target_os = "linux", feature = "os-webview")
        ))]
        {
            let mut builder = wry::WebViewBuilder::new();

            if let Some(html) = &config.html {
                builder = builder.with_html(html);
            }

            if let Some(url) = &config.url {
                builder = builder.with_url(url);
            }

            if let Some(user_agent) = &config.user_agent {
                builder = builder.with_user_agent(user_agent);
            }

            if config.transparent {
                builder = builder.with_transparent(true);
            }

            for script in &config.initialization_scripts {
                builder = builder.with_initialization_script(script);
            }

            let webview = builder
                .build_headless()
                .map_err(|e| HeadlessWebViewError::InitializationFailed {
                    message: e.to_string(),
                })?;

            Ok(Arc::new(Self {
                inner: Arc::new(Mutex::new(webview)),
            }))
        }

        #[cfg(not(any(
            target_os = "windows",
            target_vendor = "apple",
            target_os = "android",
            all(target_os = "linux", feature = "os-webview")
        )))]
        {
            let _ = config;
            Err(HeadlessWebViewError::UnsupportedPlatform {
                message: "Headless webview native backend is not enabled for this target. On Linux, ensure `os-webview` feature is enabled and webkit2gtk is installed.".to_string(),
            })
        }
    }

    pub fn load_html(&self, html: String) -> Result<(), HeadlessWebViewError> {
        #[cfg(any(
            target_os = "windows",
            target_vendor = "apple",
            target_os = "android",
            all(target_os = "linux", feature = "os-webview")
        ))]
        {
            let webview = self.inner.lock().map_err(|_| HeadlessWebViewError::InvalidState {
                message: "Failed to acquire webview lock".to_string(),
            })?;

            webview
                .load_html(&html)
                .map_err(|e| HeadlessWebViewError::NavigationFailed {
                    message: e.to_string(),
                })
        }

        #[cfg(not(any(
            target_os = "windows",
            target_vendor = "apple",
            target_os = "android",
            all(target_os = "linux", feature = "os-webview")
        )))]
        {
            let _ = html;
            Err(HeadlessWebViewError::UnsupportedPlatform {
                message: "Unsupported platform".to_string(),
            })
        }
    }

    pub fn load_url(&self, url: String) -> Result<(), HeadlessWebViewError> {
        #[cfg(any(
            target_os = "windows",
            target_vendor = "apple",
            target_os = "android",
            all(target_os = "linux", feature = "os-webview")
        ))]
        {
            let webview = self.inner.lock().map_err(|_| HeadlessWebViewError::InvalidState {
                message: "Failed to acquire webview lock".to_string(),
            })?;

            webview
                .load_url(&url)
                .map_err(|e| HeadlessWebViewError::NavigationFailed {
                    message: e.to_string(),
                })
        }

        #[cfg(not(any(
            target_os = "windows",
            target_vendor = "apple",
            target_os = "android",
            all(target_os = "linux", feature = "os-webview")
        )))]
        {
            let _ = url;
            Err(HeadlessWebViewError::UnsupportedPlatform {
                message: "Unsupported platform".to_string(),
            })
        }
    }

    pub fn eval(&self, script: String) -> Result<String, HeadlessWebViewError> {
        #[cfg(any(
            target_os = "windows",
            target_vendor = "apple",
            target_os = "android",
            all(target_os = "linux", feature = "os-webview")
        ))]
        {
            let webview = self.inner.lock().map_err(|_| HeadlessWebViewError::InvalidState {
                message: "Failed to acquire webview lock".to_string(),
            })?;

            let (tx, rx) = std::sync::mpsc::channel();
            webview
                .evaluate_script_with_callback(&script, move |result| {
                    let _ = tx.send(result);
                })
                .map_err(|e| HeadlessWebViewError::ScriptEvaluationFailed {
                    message: e.to_string(),
                })?;

            rx.recv_timeout(Duration::from_secs(15))
                .map_err(|e| HeadlessWebViewError::ScriptEvaluationFailed {
                    message: format!("Script evaluation timed out: {e}"),
                })
        }

        #[cfg(not(any(
            target_os = "windows",
            target_vendor = "apple",
            target_os = "android",
            all(target_os = "linux", feature = "os-webview")
        )))]
        {
            let _ = script;
            Err(HeadlessWebViewError::UnsupportedPlatform {
                message: "Unsupported platform".to_string(),
            })
        }
    }

    pub fn print_to_pdf(&self, options: Option<PdfPrintOptions>) -> Result<Vec<u8>, HeadlessWebViewError> {
        #[cfg(any(
            target_os = "windows",
            target_vendor = "apple",
            target_os = "android",
            all(target_os = "linux", feature = "os-webview")
        ))]
        {
            let webview = self.inner.lock().map_err(|_| HeadlessWebViewError::InvalidState {
                message: "Failed to acquire webview lock".to_string(),
            })?;

            let (tx, rx) = std::sync::mpsc::channel();
            let wry_options = options.unwrap_or_default().into();

            webview
                .print_to_pdf(wry_options, move |result| {
                    let _ = tx.send(result);
                })
                .map_err(|e| HeadlessWebViewError::PdfGenerationFailed {
                    message: e.to_string(),
                })?;

            #[cfg(target_os = "linux")]
            {
                while rx.try_recv().is_err() {
                    while gtk::events_pending() {
                        gtk::main_iteration();
                    }
                    std::thread::sleep(Duration::from_millis(5));
                }
            }

            let pdf_bytes = rx
                .recv_timeout(Duration::from_secs(30))
                .map_err(|e| HeadlessWebViewError::PdfGenerationFailed {
                    message: format!("PDF generation timed out: {e}"),
                })?
                .map_err(|e| HeadlessWebViewError::PdfGenerationFailed {
                    message: e.to_string(),
                })?;

            Ok(pdf_bytes)
        }

        #[cfg(not(any(
            target_os = "windows",
            target_vendor = "apple",
            target_os = "android",
            all(target_os = "linux", feature = "os-webview")
        )))]
        {
            let _ = options;
            Err(HeadlessWebViewError::UnsupportedPlatform {
                message: "Unsupported platform".to_string(),
            })
        }
    }

    pub fn print_to_pdf_file(&self, output_path: String, options: Option<PdfPrintOptions>) -> Result<(), HeadlessWebViewError> {
        #[cfg(any(
            target_os = "windows",
            target_vendor = "apple",
            target_os = "android",
            all(target_os = "linux", feature = "os-webview")
        ))]
        {
            let webview = self.inner.lock().map_err(|_| HeadlessWebViewError::InvalidState {
                message: "Failed to acquire webview lock".to_string(),
            })?;

            let (tx, rx) = std::sync::mpsc::channel();
            let wry_options = options.unwrap_or_default().into();
            let path = std::path::PathBuf::from(&output_path);

            webview
                .print_to_pdf_file(&path, wry_options, move |result| {
                    let _ = tx.send(result);
                })
                .map_err(|e| HeadlessWebViewError::PdfGenerationFailed {
                    message: e.to_string(),
                })?;

            #[cfg(target_os = "linux")]
            {
                while rx.try_recv().is_err() {
                    while gtk::events_pending() {
                        gtk::main_iteration();
                    }
                    std::thread::sleep(Duration::from_millis(5));
                }
            }

            rx.recv_timeout(Duration::from_secs(30))
                .map_err(|e| HeadlessWebViewError::PdfGenerationFailed {
                    message: format!("PDF file generation timed out: {e}"),
                })?
                .map_err(|e| HeadlessWebViewError::PdfGenerationFailed {
                    message: e.to_string(),
                })?;

            Ok(())
        }

        #[cfg(not(any(
            target_os = "windows",
            target_vendor = "apple",
            target_os = "android",
            all(target_os = "linux", feature = "os-webview")
        )))]
        {
            let _ = output_path;
            let _ = options;
            Err(HeadlessWebViewError::UnsupportedPlatform {
                message: "Unsupported platform".to_string(),
            })
        }
    }
}
