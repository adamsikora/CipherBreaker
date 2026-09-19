package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.os.Bundle
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.View
import android.widget.*
import androidx.core.text.HtmlCompat
import java.util.ArrayList
import kotlin.math.sqrt

class NumberAnalyzerActivity : Activity() {

    private val rowsLayout by lazy { findViewById<LinearLayout>(R.id.rowsLayout) }
    private val inputTypeSpinner by lazy { findViewById<Spinner>(R.id.inputTypeSpinner) }
    private val outputTypeSpinner by lazy { findViewById<Spinner>(R.id.outputTypeSpinner) }
    internal var rows = ArrayList<View>()

    private fun addRow() {
        val layout = layoutInflater.inflate(R.layout.number_analysis_row, null, false) as RelativeLayout
        rows.add(layout)
        rowsLayout.addView(layout)

        val editText = layout.findViewById<EditText>(R.id.numberInput)
        editText.inputType = keyboardInputType()
        editText.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable) {}
            override fun beforeTextChanged(s: CharSequence, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence, start: Int, before: Int, count: Int) {
                analyzeRow(layout)
            }
        })
    }

    private fun analyzeRow(row: View) {
        val textView = row.findViewById<TextView>(R.id.numberAnalysisView)
        val input = row.findViewById<EditText>(R.id.numberInput).text.toString().trim()
        if (input.isEmpty()) {
            textView.text = ""
            return
        }

        val number = parseNumber(input)
        if (number == null) {
            textView.text = "Unable to parse the number"
            return
        }

        val frequencies = factorNumber(number).groupingBy { it }.eachCount()
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

    // Interprets the input according to the input type currently selected in the spinner.
    private fun parseNumber(input: String): ULong? {
        val inputType = inputTypeSpinner.selectedItem?.toString() ?: return null
        if (inputType == ROMAN_NUMERALS) {
            return parseRomanNumeral(input)
        }
        val radix = inputType.removePrefix("base-").toIntOrNull() ?: return null
        return input.toULongOrNull(radix)
    }

    private fun parseRomanNumeral(input: String): ULong? {
        val numeral = input.uppercase()
        if (numeral.isEmpty() || !ROMAN_PATTERN.matches(numeral)) {
            return null
        }

        var total = 0.toULong()
        var previous = 0.toULong()
        // Walk right to left: a numeral smaller than the one to its right is subtracted
        for (c in numeral.reversed()) {
            val value = ROMAN_VALUES.getValue(c)
            if (value < previous) {
                total -= value
            } else {
                total += value
                previous = value
            }
        }
        return total
    }

    // Hexadecimal and roman numerals need letters, the remaining bases only digits.
    private fun keyboardInputType(): Int {
        val inputType = inputTypeSpinner.selectedItem?.toString()
        return if (inputType == ROMAN_NUMERALS || inputType == "base-16") {
            InputType.TYPE_CLASS_TEXT or
                    InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS or
                    InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
        } else {
            InputType.TYPE_CLASS_NUMBER
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.activity_number_analyzer)

        // Start on the common case rather than on the first entry of each list
        val inputTypes = resources.getStringArray(R.array.input_type)
        inputTypeSpinner.setSelection(inputTypes.indexOf("base-10").coerceAtLeast(0), false)
        val outputTypes = resources.getStringArray(R.array.output_type)
        outputTypeSpinner.setSelection(outputTypes.indexOf("prime factors").coerceAtLeast(0), false)

        inputTypeSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val keyboard = keyboardInputType()
                for (row in rows) {
                    row.findViewById<EditText>(R.id.numberInput).inputType = keyboard
                    analyzeRow(row)
                }
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

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

    private fun factorNumber(number: ULong):  ArrayList<ULong> {
        val factors: ArrayList<ULong> = arrayListOf()
        if (number < 2.toULong()) {
            return factors
        }
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

    companion object {
        private const val ROMAN_NUMERALS = "roman numerals"
        // Only canonical numerals: IV/IX/XL/XC/CD/CM are the only subtractive pairs,
        // I/X/C repeat at most three times and V/L/D at most once. Thousands are left
        // unbounded, because values above MMM have no other plain text notation.
        private val ROMAN_PATTERN =
                Regex("M*(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})")

        private val ROMAN_VALUES = mapOf(
                'I' to 1.toULong(), 'V' to 5.toULong(), 'X' to 10.toULong(), 'L' to 50.toULong(),
                'C' to 100.toULong(), 'D' to 500.toULong(), 'M' to 1000.toULong())
    }
}
