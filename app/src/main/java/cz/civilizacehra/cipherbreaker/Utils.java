package cz.civilizacehra.cipherbreaker;

import android.content.Context;
import android.widget.Toast;

class Utils {
    static void toastIt(Context context, String msg) {
        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show();
    }
}
