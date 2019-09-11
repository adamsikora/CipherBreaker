package cz.civilizacehra.cipherbreaker

import android.content.Context
import android.widget.Toast

internal object Utils {
    fun toastIt(context: Context, msg: String) {
        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
    }
}
