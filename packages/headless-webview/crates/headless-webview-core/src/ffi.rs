use crate::config::WebViewConfig;
use crate::engine::HeadlessWebViewCore;
use crate::options::PdfPrintOptions;
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::sync::{Arc, Mutex};

static LAST_ERROR: Mutex<Option<String>> = Mutex::new(None);

fn set_last_error(err: String) {
    if let Ok(mut lock) = LAST_ERROR.lock() {
        *lock = Some(err);
    }
}

pub struct FfiHandle {
    pub core: Arc<HeadlessWebViewCore>,
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn headless_webview_create(
    config_json: *const c_char,
    out_handle: *mut *mut FfiHandle,
) -> i32 {
    if out_handle.is_null() {
        return -1;
    }

    let config: WebViewConfig = if !config_json.is_null() {
        let c_str = unsafe { CStr::from_ptr(config_json) };
        match c_str.to_str() {
            Ok(str_slice) => serde_json::from_str(str_slice).unwrap_or_default(),
            Err(e) => {
                set_last_error(format!("Invalid config UTF-8: {e}"));
                return -2;
            }
        }
    } else {
        WebViewConfig::default()
    };

    match HeadlessWebViewCore::new(config) {
        Ok(core) => {
            let handle = Box::into_raw(Box::new(FfiHandle { core }));
            unsafe {
                *out_handle = handle;
            }
            0
        }
        Err(e) => {
            set_last_error(e.to_string());
            -3
        }
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn headless_webview_destroy(handle: *mut FfiHandle) {
    if !handle.is_null() {
        unsafe {
            drop(Box::from_raw(handle));
        }
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn headless_webview_load_html(
    handle: *mut FfiHandle,
    html: *const c_char,
) -> i32 {
    if handle.is_null() || html.is_null() {
        return -1;
    }
    let handle_ref = unsafe { &*handle };
    let html_str = match unsafe { CStr::from_ptr(html) }.to_str() {
        Ok(s) => s.to_string(),
        Err(e) => {
            set_last_error(format!("Invalid HTML UTF-8: {e}"));
            return -2;
        }
    };

    match handle_ref.core.load_html(html_str) {
        Ok(()) => 0,
        Err(e) => {
            set_last_error(e.to_string());
            -3
        }
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn headless_webview_load_url(
    handle: *mut FfiHandle,
    url: *const c_char,
) -> i32 {
    if handle.is_null() || url.is_null() {
        return -1;
    }
    let handle_ref = unsafe { &*handle };
    let url_str = match unsafe { CStr::from_ptr(url) }.to_str() {
        Ok(s) => s.to_string(),
        Err(e) => {
            set_last_error(format!("Invalid URL UTF-8: {e}"));
            return -2;
        }
    };

    match handle_ref.core.load_url(url_str) {
        Ok(()) => 0,
        Err(e) => {
            set_last_error(e.to_string());
            -3
        }
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn headless_webview_eval(
    handle: *mut FfiHandle,
    script: *const c_char,
    out_result: *mut *mut c_char,
) -> i32 {
    if handle.is_null() || script.is_null() || out_result.is_null() {
        return -1;
    }
    let handle_ref = unsafe { &*handle };
    let script_str = match unsafe { CStr::from_ptr(script) }.to_str() {
        Ok(s) => s.to_string(),
        Err(e) => {
            set_last_error(format!("Invalid script UTF-8: {e}"));
            return -2;
        }
    };

    match handle_ref.core.eval(script_str) {
        Ok(result) => {
            if let Ok(c_string) = CString::new(result) {
                unsafe {
                    *out_result = c_string.into_raw();
                }
                0
            } else {
                set_last_error("Null byte in eval result".to_string());
                -4
            }
        }
        Err(e) => {
            set_last_error(e.to_string());
            -3
        }
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn headless_webview_print_to_pdf(
    handle: *mut FfiHandle,
    options_json: *const c_char,
    out_bytes: *mut *mut u8,
    out_len: *mut usize,
) -> i32 {
    if handle.is_null() || out_bytes.is_null() || out_len.is_null() {
        return -1;
    }
    let handle_ref = unsafe { &*handle };
    let options: Option<PdfPrintOptions> = if !options_json.is_null() {
        let c_str = unsafe { CStr::from_ptr(options_json) };
        match c_str.to_str() {
            Ok(str_slice) => serde_json::from_str(str_slice).ok(),
            Err(e) => {
                set_last_error(format!("Invalid options UTF-8: {e}"));
                return -2;
            }
        }
    } else {
        None
    };

    match handle_ref.core.print_to_pdf(options) {
        Ok(bytes) => {
            let len = bytes.len();
            let mut boxed_slice = bytes.into_boxed_slice();
            unsafe {
                *out_len = len;
                *out_bytes = boxed_slice.as_mut_ptr();
            }
            std::mem::forget(boxed_slice);
            0
        }
        Err(e) => {
            set_last_error(e.to_string());
            -3
        }
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn headless_webview_print_to_pdf_file(
    handle: *mut FfiHandle,
    path: *const c_char,
    options_json: *const c_char,
) -> i32 {
    if handle.is_null() || path.is_null() {
        return -1;
    }
    let handle_ref = unsafe { &*handle };
    let path_str = match unsafe { CStr::from_ptr(path) }.to_str() {
        Ok(s) => s.to_string(),
        Err(e) => {
            set_last_error(format!("Invalid path UTF-8: {e}"));
            return -2;
        }
    };

    let options: Option<PdfPrintOptions> = if !options_json.is_null() {
        let c_str = unsafe { CStr::from_ptr(options_json) };
        match c_str.to_str() {
            Ok(str_slice) => serde_json::from_str(str_slice).ok(),
            Err(e) => {
                set_last_error(format!("Invalid options UTF-8: {e}"));
                return -2;
            }
        }
    } else {
        None
    };

    match handle_ref.core.print_to_pdf_file(path_str, options) {
        Ok(()) => 0,
        Err(e) => {
            set_last_error(e.to_string());
            -3
        }
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn headless_webview_free_bytes(bytes: *mut u8, len: usize) {
    if !bytes.is_null() && len > 0 {
        unsafe {
            drop(Vec::from_raw_parts(bytes, len, len));
        }
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn headless_webview_free_string(str_ptr: *mut c_char) {
    if !str_ptr.is_null() {
        unsafe {
            drop(CString::from_raw(str_ptr));
        }
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn headless_webview_get_last_error(out_msg: *mut *mut c_char) -> i32 {
    if out_msg.is_null() {
        return -1;
    }
    if let Ok(mut lock) = LAST_ERROR.lock() {
        if let Some(err) = lock.take() {
            if let Ok(c_str) = CString::new(err) {
                unsafe {
                    *out_msg = c_str.into_raw();
                }
                return 0;
            }
        }
    }
    unsafe {
        *out_msg = std::ptr::null_mut();
    }
    0
}
