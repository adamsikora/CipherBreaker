package cz.civilizacehra.cipherbreaker

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import com.google.android.gms.maps.model.LatLng
import java.util.*

internal object Utils {
    fun parseIntWithDefault(s: String, default: Int = 0): Int {
        return if (s.matches("-?\\d+".toRegex())) s.toInt() else default
    }

    fun formatCoord(coord: Double): String {
        // 5 digits produces coordinates with precision of ~1m
        return String.format(Locale.ENGLISH, "%.5f", coord)
    }

    fun formatLatLng(coords: LatLng): String {
        return "${formatCoord(coords.latitude)}, ${formatCoord(coords.longitude)}"
    }
}

fun Context.copyToClipboard(label: String, text: String){
    val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText(label, text)
    clipboard.setPrimaryClip(clip)
    applicationContext.toastIt("$label copied to clipboard")
}

fun Context.toastIt(msg: String) {
    Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
}