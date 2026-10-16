package android.print

import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import java.io.File

class PdfPrintHelper(private val printAttributes: PrintAttributes) {
    fun print(
        adapter: PrintDocumentAdapter,
        outputFile: File,
        onSuccess: () -> Unit,
        onError: (Throwable) -> Unit
    ) {
        adapter.onLayout(null, printAttributes, null, object : PrintDocumentAdapter.LayoutResultCallback() {
            override fun onLayoutFinished(info: PrintDocumentInfo?, changed: Boolean) {
                try {
                    val descriptor = ParcelFileDescriptor.open(
                        outputFile,
                        ParcelFileDescriptor.MODE_CREATE or
                        ParcelFileDescriptor.MODE_READ_WRITE or
                        ParcelFileDescriptor.MODE_TRUNCATE
                    )

                    adapter.onWrite(
                        arrayOf(PageRange.ALL_PAGES),
                        descriptor,
                        CancellationSignal(),
                        object : PrintDocumentAdapter.WriteResultCallback() {
                            override fun onWriteFinished(pages: Array<out PageRange>?) {
                                try { descriptor.close() } catch (_: Exception) {}
                                onSuccess()
                            }

                            override fun onWriteFailed(error: CharSequence?) {
                                try { descriptor.close() } catch (_: Exception) {}
                                onError(RuntimeException(error?.toString() ?: "Write failed"))
                            }

                            override fun onWriteCancelled() {
                                try { descriptor.close() } catch (_: Exception) {}
                                onError(RuntimeException("Print cancelled"))
                            }
                        }
                    )
                } catch (e: Exception) {
                    onError(e)
                }
            }

            override fun onLayoutFailed(error: CharSequence?) {
                onError(RuntimeException(error?.toString() ?: "Layout failed"))
            }

            override fun onLayoutCancelled() {
                onError(RuntimeException("Layout cancelled"))
            }
        }, null)
    }
}
