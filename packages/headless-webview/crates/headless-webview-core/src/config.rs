#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, uniffi::Record)]
pub struct WebViewConfig {
    pub url: Option<String>,
    pub html: Option<String>,
    pub user_agent: Option<String>,
    pub devtools: bool,
    pub transparent: bool,
    pub initialization_scripts: Vec<String>,
    #[serde(default)]
    pub data_directory: Option<String>,
}

impl Default for WebViewConfig {
    fn default() -> Self {
        Self {
            url: None,
            html: None,
            user_agent: None,
            devtools: false,
            transparent: false,
            initialization_scripts: Vec::new(),
            data_directory: None,
        }
    }
}
