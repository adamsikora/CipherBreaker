package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import android.widget.TextView

import java.util.Locale

class MrizkoDrticActivity : Activity() {

    private val goBtn by lazy { findViewById<Button>(R.id.GoBtn) }
    private val inputBox by lazy { findViewById<EditText>(R.id.inputEditText) }
    private val results by lazy { findViewById<TextView>(R.id.resultTextView) }

    private var isTrieInitialized: Boolean = false

    private external fun grindGrid(str: String): String
    private external fun initializeTrie(mgr: Any)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_mrizko_drtic)

        goBtn.setOnClickListener {
            val inputManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
            inputManager.hideSoftInputFromWindow(currentFocus!!.windowToken, InputMethodManager.HIDE_NOT_ALWAYS)

            results.text = "Result:"

            val input = inputBox.text.toString().replace("[^A-Za-z0-9_]".toRegex(), "").toLowerCase(Locale.ENGLISH)

            try {
                if (!isTrieInitialized) {
                    initializeTrie(applicationContext.assets)
                    isTrieInitialized = true
                }
                val start = System.currentTimeMillis()
                val solutions = grindGrid(input)
                results.text = "Result: " + String.format(Locale.ENGLISH, "%.3f", 0.001 * (System.currentTimeMillis() - start)) + "s\n" + solutions
            } catch (e: Throwable) {
                Utils.toastIt(applicationContext, "Error calculating grid")
            }
        }
    }

    companion object {

        init {
            System.loadLibrary("MrizkoDrtic")
        }
    }
}
