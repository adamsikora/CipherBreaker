package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.*
import androidx.core.text.HtmlCompat
import java.util.ArrayList
import kotlin.math.sqrt

class PrimeActivity : Activity() {

    private val rowsLayout by lazy { findViewById<LinearLayout>(R.id.rowsLayout) }
    internal var rows = ArrayList<View>()

    private fun addRow() {
        val layout = layoutInflater.inflate(R.layout.primerow, null, false) as RelativeLayout
        rows.add(layout)
        rowsLayout.addView(layout)

        val textView = layout.findViewById<TextView>(R.id.primeFactorsView)
        layout.findViewById<EditText>(R.id.primeInput).addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable) {}
            override fun beforeTextChanged(s: CharSequence, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence, start: Int, before: Int, count: Int) {
                val input = s.toString()
                if (input.isEmpty()) {
                    textView.text = ""
                } else {
                    val factors: ArrayList<ULong> = factorNumber(input)
                    val frequencies = factors.groupingBy { it }.eachCount()
                    var text = ""
                    for ((key, value) in frequencies.entries) {
                        text += key.toString()
                        if (value > 1) {
                            text += "<sup><small>$value</small></sup>"
                        }
                        text += " "
                    }
                    textView.text = HtmlCompat.fromHtml(text, HtmlCompat.FROM_HTML_MODE_LEGACY)
                }
            }
        })
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.activity_prime)
        val add30Rows = fun() {
            for (i in 0..29) {
                addRow()
            }
        }
        add30Rows()

        val scrollView = findViewById<ScrollView>(R.id.scrollView)
        scrollView.viewTreeObserver.addOnScrollChangedListener {
            if (!scrollView.canScrollVertically(1)) {
                add30Rows()
            }
        }
    }

    private fun factorNumber(numberString: String):  ArrayList<ULong> {
        val factors: ArrayList<ULong> = arrayListOf()
        val number = numberString.toULong()
        var n = number
        val squareRoot = sqrt(number.toDouble()).toULong()

        // At first check for divisibility by 2. add it in arr till it is divisible
        while (n % 2u == 0.toULong()) {
            factors.add(2u)
            n /= 2u
        }

        // Run loop from 3 to square root of n. Check for divisibility by i.
        // Add i in arr till it is divisible by i.
        for (i in 3.toULong()..squareRoot step 2) {
            while (n % i == 0.toULong()) {
                factors.add(i)
                n /= i
            }
            if (n < i) {
                break
            }
        }

        // If n is a prime number greater than 2.
        if (n > 2u) {
            factors.add(n)
        }
        return factors
    }
}
