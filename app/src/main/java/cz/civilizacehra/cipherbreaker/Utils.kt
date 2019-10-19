package cz.civilizacehra.cipherbreaker

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast

internal object Utils {
    fun parseIntWithDefault(s: String, default: Int = 0): Int {
        return if (s.matches("-?\\d+".toRegex())) s.toInt() else default
    }
}

fun Context.copyToClipboard(label: String, text: String){
    val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText(label, text)
    clipboard.primaryClip = clip
    applicationContext.toastIt("$label copied to clipboard")
}

fun Context.toastIt(msg: String) {
    Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
}
