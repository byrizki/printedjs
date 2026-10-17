use headless_webview_core::{HeadlessWebViewCore, PdfPrintOptions, WebViewConfig};
use std::env;
use std::path::PathBuf;
use std::process;

fn print_usage() {
    eprintln!(
        "Usage: headless-webview <input-html-or-url> -o <output.pdf> [options]\n\
         Options:\n\
         \x20 -o, --output <path>    Output PDF file path\n\
         \x20 --landscape            Print in landscape orientation\n\
         \x20 --scale <number>       Scale multiplier (default: 1.0)\n\
         \x20 --format <name>        Paper size format (A4, Letter, etc.)\n"
    );
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 || args.contains(&"--help".to_string()) || args.contains(&"-h".to_string()) {
        print_usage();
        process::exit(if args.len() < 2 { 1 } else { 0 });
    }

    let mut input = String::new();
    let mut output = "output.pdf".to_string();
    let mut landscape = false;
    let mut scale = 1.0;
    let mut page_width = Some(8.27);
    let mut page_height = Some(11.69);

    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "-o" | "--output" => {
                if i + 1 < args.len() {
                    output = args[i + 1].clone();
                    i += 1;
                }
            }
            "--landscape" => {
                landscape = true;
            }
            "--scale" => {
                if i + 1 < args.len() {
                    if let Ok(s) = args[i + 1].parse::<f64>() {
                        scale = s;
                    }
                    i += 1;
                }
            }
            "--format" => {
                if i + 1 < args.len() {
                    let fmt = args[i + 1].to_lowercase();
                    if fmt == "letter" {
                        page_width = Some(8.5);
                        page_height = Some(11.0);
                    } else if fmt == "legal" {
                        page_width = Some(8.5);
                        page_height = Some(14.0);
                    } else if fmt == "a3" {
                        page_width = Some(11.69);
                        page_height = Some(16.54);
                    }
                    i += 1;
                }
            }
            arg if !arg.starts_with('-') && input.is_empty() => {
                input = arg.to_string();
            }
            _ => {}
        }
        i += 1;
    }

    if input.is_empty() {
        eprintln!("Error: Missing input HTML file or URL.");
        print_usage();
        process::exit(1);
    }

    let (url, html) = if input.starts_with("http://") || input.starts_with("https://") {
        (Some(input), None)
    } else {
        let path = PathBuf::from(&input);
        let abs_path = if path.is_absolute() {
            path
        } else {
            env::current_dir().unwrap_or_default().join(path)
        };

        if !abs_path.exists() {
            eprintln!("Error: Input file does not exist: {}", abs_path.display());
            process::exit(1);
        }

        let content = std::fs::read_to_string(&abs_path).unwrap_or_default();
        (None, Some(content))
    };

    let config = WebViewConfig {
        url,
        html,
        user_agent: None,
        devtools: false,
        transparent: false,
        initialization_scripts: Vec::new(),
    };

    let core = match HeadlessWebViewCore::new(config) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Error initializing headless webview: {e}");
            process::exit(1);
        }
    };

    let print_options = PdfPrintOptions {
        landscape,
        page_width,
        page_height,
        margin_top: 0.0,
        margin_bottom: 0.0,
        margin_left: 0.0,
        margin_right: 0.0,
        print_background: true,
        scale,
    };

    if let Err(e) = core.print_to_pdf_file(output.clone(), Some(print_options)) {
        eprintln!("Error printing to PDF: {e}");
        process::exit(1);
    }

    println!("Successfully rendered PDF to: {output}");
}
