package cz.civilizacehra.cipherbreaker

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.widget.Toast
import com.google.android.gms.maps.model.BitmapDescriptor
import com.google.android.gms.maps.model.BitmapDescriptorFactory
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

    // BitmapDescriptorFactory.fromResource can not handle vector drawables
    fun vectorToBitmapDescriptor(context: Context, drawableId: Int): BitmapDescriptor {
        val drawable = context.getDrawable(drawableId)!!
        drawable.setBounds(0, 0, drawable.intrinsicWidth, drawable.intrinsicHeight)
        val bitmap = Bitmap.createBitmap(
                drawable.intrinsicWidth, drawable.intrinsicHeight, Bitmap.Config.ARGB_8888)
        drawable.draw(Canvas(bitmap))
        return BitmapDescriptorFactory.fromBitmap(bitmap)
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