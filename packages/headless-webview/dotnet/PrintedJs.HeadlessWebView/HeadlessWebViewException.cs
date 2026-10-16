using System;

namespace PrintedJs.HeadlessWebView;

public class HeadlessWebViewException : Exception
{
    public int ErrorCode { get; }

    public HeadlessWebViewException(string message, int errorCode = -1) 
        : base(message)
    {
        ErrorCode = errorCode;
    }

    public HeadlessWebViewException(string message, Exception innerException, int errorCode = -1) 
        : base(message, innerException)
    {
        ErrorCode = errorCode;
    }
}
