use thiserror::Error;

#[derive(Error, Debug, uniffi::Error)]
pub enum HeadlessWebViewError {
    #[error("Initialization failed: {message}")]
    InitializationFailed { message: String },

    #[error("Navigation error: {message}")]
    NavigationFailed { message: String },

    #[error("PDF generation failed: {message}")]
    PdfGenerationFailed { message: String },

    #[error("Script evaluation error: {message}")]
    ScriptEvaluationFailed { message: String },

    #[error("Invalid state: {message}")]
    InvalidState { message: String },

    #[error("I/O error: {message}")]
    IoError { message: String },

    #[error("Unsupported platform or operation: {message}")]
    UnsupportedPlatform { message: String },
}

impl From<std::io::Error> for HeadlessWebViewError {
    fn from(err: std::io::Error) -> Self {
        Self::IoError {
            message: err.to_string(),
        }
    }
}
