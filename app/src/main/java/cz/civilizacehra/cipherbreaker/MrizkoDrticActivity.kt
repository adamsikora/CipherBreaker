package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import kotlinx.coroutines.*

import java.util.Locale

class MrizkoDrticActivity : Activity() {

    private val goBtn by lazy { findViewById<Button>(R.id.GoBtn) }
    private val inputBox by lazy { findViewById<EditText>(R.id.inputEditText) }
    private val progressBar by lazy { findViewById<ProgressBar>(R.id.indeterminateProgressBar) }
    private val timeView by lazy { findViewById<TextView>(R.id.timeValueView) }
    private val resultView by lazy { findViewById<TextView>(R.id.resultTextView) }

    private var mJob: Job = Job()

    private var isTrieInitialized: Boolean = false

    private external fun grindGrid(str: String): String
    private external fun initializeTrie(mgr: Any)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_mrizko_drtic)

        goBtn.setOnClickListener {
            val inputManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
            inputManager.hideSoftInputFromWindow(currentFocus!!.windowToken, InputMethodManager.HIDE_NOT_ALWAYS)

            val input = inputBox.text.toString().replace("[^A-Za-z0-9_]".toRegex(), "").toLowerCase(Locale.ENGLISH)

            try {
                computeGrid(input)
            } catch (e: Throwable) {
                applicationContext.toastIt("Error calculating grid")
            }
        }
    }

    private fun computeGrid(input: String) {
        if (mJob.isActive) {
            mJob.cancel()
            // TODO make sure job got cancelled
        }
        mJob = GlobalScope.launch(Dispatchers.Main) {
            if (!isTrieInitialized) {
                resultView.text = "Initializing..."
                runWithProgress {
                    initializeTrie(applicationContext.assets)
                }
                isTrieInitialized = true
            }
            resultView.text = "Computing..."

            var solutions = ""
            runWithProgress {
                solutions = grindGrid(input)
            }
            resultView.text = solutions
        }
    }
    private suspend fun <T> runWithProgress(block: suspend CoroutineScope.() -> T) {
        progressBar.visibility = View.VISIBLE
        val start = System.currentTimeMillis()
        val progressJob = GlobalScope.launch(Dispatchers.Main) {
            while (true) {
                timeView.text = timeFromStart(start).toString()
                delay(100)
            }
        }
        withContext(Dispatchers.Default) {
            block()
        }
        progressJob.cancel()
        timeView.text = timeFromStart(start).toString()
        progressBar.visibility = View.INVISIBLE
    }

    private fun timeFromStart(start: Long): Double {
        return (System.currentTimeMillis() - start) / 1000.0
    }

    companion object {

        init {
            System.loadLibrary("MrizkoDrtic")
        }
    }
}
