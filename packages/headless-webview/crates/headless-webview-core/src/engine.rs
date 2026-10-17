#[cfg(any(
    target_os = "windows",
    target_vendor = "apple",
    target_os = "android",
    all(target_os = "linux", feature = "os-webview")
))]
use std::sync::Mutex;
#[cfg(any(
    target_os = "windows",
    target_vendor = "apple",
    target_os = "android",
    all(target_os = "linux", feature = "os-webview")
))]
use std::time::Duration;
use std::sync::Arc;
use crate::config::WebViewConfig;
use crate::error::HeadlessWebViewError;
use crate::options::PdfPrintOptions;

#[cfg(any(
    target_os = "windows",
    target_vendor = "apple",
    target_os = "android",
    all(target_os = "linux", feature = "os-webview")
))]
fn pump_platform_events() {
    #[cfg(target_os = "linux")]
    {
        while gtk::events_pending() {
            gtk::main_iteration();
        }
    }

    #[cfg(target_os = "windows")]
    unsafe {
        use windows::Win32::UI::WindowsAndMessaging::{
            DispatchMessageW, MsgWaitForMultipleObjectsEx, PM_REMOVE, PeekMessageW, QS_ALLINPUT,
        };
        let mut msg = std::mem::zeroed();
        while PeekMessageW(&mut msg, None, 0, 0, PM_REMOVE).as_bool() {
            DispatchMessageW(&msg);
        }
        let _ = MsgWaitForMultipleObjectsEx(
            None,
            5,
            QS_ALLINPUT,
            windows::Win32::UI::WindowsAndMessaging::MWMO_INPUTAVAILABLE,
        );
    }

    #[cfg(target_vendor = "apple")]
    unsafe {
        let rl = objc2_foundation::NSRunLoop::mainRunLoop();
        let limit_date = objc2_foundation::NSDate::dateWithTimeIntervalSinceNow(0.005);
        let mode = objc2_foundation::ns_string!("NSDefaultRunLoopMode");
        rl.acceptInputForMode_beforeDate(mode, &limit_date);
    }
}

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

            let has_content = config.html.is_some() || config.url.is_some();
            let (load_tx, load_rx) = std::sync::mpsc::channel();

            if has_content {
                builder = builder.with_on_page_load_handler(move |event, _| {
                    if event == wry::PageLoadEvent::Finished {
                        let _ = load_tx.send(());
                    }
                });
            }

            let webview = builder
                .build_headless()
                .map_err(|e| HeadlessWebViewError::InitializationFailed {
                    message: e.to_string(),
                })?;

            #[cfg(target_os = "linux")]
            if has_content {
                let start = std::time::Instant::now();
                loop {
                    match load_rx.try_recv() {
                        Ok(()) => break,
                        Err(std::sync::mpsc::TryRecvError::Disconnected) => break,
                        Err(std::sync::mpsc::TryRecvError::Empty) => {
                            if start.elapsed() > Duration::from_secs(10) {
                                break;
                            }
                            while gtk::events_pending() {
                                gtk::main_iteration();
                            }
                            std::thread::sleep(Duration::from_millis(5));
                        }
                    }
                }
            }

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

            let start = std::time::Instant::now();
            let timeout = Duration::from_secs(15);
            loop {
                match rx.try_recv() {
                    Ok(res) => return Ok(res),
                    Err(std::sync::mpsc::TryRecvError::Disconnected) => {
                        return Err(HeadlessWebViewError::ScriptEvaluationFailed {
                            message: "Script evaluation channel disconnected unexpectedly".to_string(),
                        });
                    }
                    Err(std::sync::mpsc::TryRecvError::Empty) => {
                        if start.elapsed() >= timeout {
                            return Err(HeadlessWebViewError::ScriptEvaluationFailed {
                                message: "Script evaluation timed out after 15 seconds".to_string(),
                            });
                        }
                        pump_platform_events();
                        std::thread::sleep(Duration::from_millis(5));
                    }
                }
            }
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

            pump_platform_events();

            webview
                .print_to_pdf(wry_options, move |result| {
                    let _ = tx.send(result);
                })
                .map_err(|e| HeadlessWebViewError::PdfGenerationFailed {
                    message: e.to_string(),
                })?;

            let start = std::time::Instant::now();
            let timeout = Duration::from_secs(30);
            loop {
                match rx.try_recv() {
                    Ok(res) => {
                        return res.map_err(|e| HeadlessWebViewError::PdfGenerationFailed {
                            message: e.to_string(),
                        });
                    }
                    Err(std::sync::mpsc::TryRecvError::Disconnected) => {
                        return Err(HeadlessWebViewError::PdfGenerationFailed {
                            message: "PDF generation channel disconnected unexpectedly".to_string(),
                        });
                    }
                    Err(std::sync::mpsc::TryRecvError::Empty) => {
                        if start.elapsed() >= timeout {
                            return Err(HeadlessWebViewError::PdfGenerationFailed {
                                message: "PDF generation timed out after 30 seconds".to_string(),
                            });
                        }
                        pump_platform_events();
                        std::thread::sleep(Duration::from_millis(5));
                    }
                }
            }
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

            pump_platform_events();

            webview
                .print_to_pdf_file(&path, wry_options, move |result| {
                    let _ = tx.send(result);
                })
                .map_err(|e| HeadlessWebViewError::PdfGenerationFailed {
                    message: e.to_string(),
                })?;

            let start = std::time::Instant::now();
            let timeout = Duration::from_secs(30);
            loop {
                match rx.try_recv() {
                    Ok(res) => {
                        return res.map_err(|e| HeadlessWebViewError::PdfGenerationFailed {
                            message: e.to_string(),
                        });
                    }
                    Err(std::sync::mpsc::TryRecvError::Disconnected) => {
                        return Err(HeadlessWebViewError::PdfGenerationFailed {
                            message: "PDF file generation channel disconnected unexpectedly".to_string(),
                        });
                    }
                    Err(std::sync::mpsc::TryRecvError::Empty) => {
                        if start.elapsed() >= timeout {
                            return Err(HeadlessWebViewError::PdfGenerationFailed {
                                message: "PDF file generation timed out after 30 seconds".to_string(),
                            });
                        }
                        pump_platform_events();
                        std::thread::sleep(Duration::from_millis(5));
                    }
                }
            }
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
