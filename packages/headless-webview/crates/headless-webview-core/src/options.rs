#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, uniffi::Record)]
pub struct PdfPrintOptions {
    pub landscape: bool,
    pub page_width: Option<f64>,
    pub page_height: Option<f64>,
    pub margin_top: f64,
    pub margin_bottom: f64,
    pub margin_left: f64,
    pub margin_right: f64,
    pub print_background: bool,
    pub scale: f64,
}

impl Default for PdfPrintOptions {
    fn default() -> Self {
        Self {
            landscape: false,
            // Standard A4 dimensions in inches: 8.27 x 11.69
            page_width: Some(8.27),
            page_height: Some(11.69),
            margin_top: 0.0,
            margin_bottom: 0.0,
            margin_left: 0.0,
            margin_right: 0.0,
            print_background: true,
            scale: 1.0,
        }
    }
}

impl From<PdfPrintOptions> for wry::PrintToPdfOptions {
    fn from(opts: PdfPrintOptions) -> Self {
        Self {
            landscape: opts.landscape,
            page_width: opts.page_width,
            page_height: opts.page_height,
            margin_top: opts.margin_top,
            margin_bottom: opts.margin_bottom,
            margin_left: opts.margin_left,
            margin_right: opts.margin_right,
            print_background: opts.print_background,
            scale: opts.scale,
        }
    }
}
