namespace PrintedJs.HeadlessWebView;

public record PdfPrintOptions
{
    public bool Landscape { get; init; } = false;

    public double? PageWidth { get; init; } = 8.27; // Standard A4 width in inches

    public double? PageHeight { get; init; } = 11.69; // Standard A4 height in inches

    public double MarginTop { get; init; } = 0.0;

    public double MarginBottom { get; init; } = 0.0;

    public double MarginLeft { get; init; } = 0.0;

    public double MarginRight { get; init; } = 0.0;

    public bool PrintBackground { get; init; } = true;

    public double Scale { get; init; } = 1.0;
}
