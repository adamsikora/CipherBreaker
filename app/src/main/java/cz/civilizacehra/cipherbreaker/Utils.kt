package cz.civilizacehra.cipherbreaker

import android.content.Context
import android.widget.Toast

internal object Utils {
    fun toastIt(context: Context, msg: String) {
        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
    }

    fun parseIntWithDefault(s: String, default: Int = 0): Int {
        return if (s.matches("-?\\d+".toRegex())) s.toInt() else default
    }
}
