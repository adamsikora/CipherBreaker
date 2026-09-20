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

        textView.text = formatNumber(number)
    }

    private fun analyzeAllRows() {
        for (row in rows) {
            analyzeRow(row)
        }
    }

    // Renders the number in the output type currently selected in the spinner.
    private fun formatNumber(number: ULong): CharSequence {
        val outputType = outputTypeSpinner.selectedItem?.toString() ?: return ""
        if (outputType == NumberAnalysis.PRIME_FACTORS) {
            return formatPrimeFactors(number)
        }
        if (outputType == NumberAnalysis.ROMAN_NUMERALS) {
            return NumberAnalysis.formatRomanNumeral(number)
                    ?: "Unable to write the number in roman numerals"
        }
        val radix = outputType.removePrefix("base-").toIntOrNull() ?: return ""
        return NumberAnalysis.formatInBase(number, radix)
    }

    private fun formatPrimeFactors(number: ULong): CharSequence {
        val frequencies = NumberAnalysis.factorNumber(number).groupingBy { it }.eachCount()
        var text = ""
        for ((key, value) in frequencies.entries) {
            text += key.toString()
            if (value > 1) {
                text += "<sup><small>$value</small></sup>"
            }
            text += " "
        }
        return HtmlCompat.fromHtml(text, HtmlCompat.FROM_HTML_MODE_LEGACY)
    }

    // Interprets the input according to the input type currently selected in the spinner.
    private fun parseNumber(input: String): ULong? {
        val inputType = inputTypeSpinner.selectedItem?.toString() ?: return null
        return NumberAnalysis.parseNumber(input, inputType)
    }

    // Hexadecimal and roman numerals need letters, the remaining bases only digits.
    private fun keyboardInputType(): Int {
        val inputType = inputTypeSpinner.selectedItem?.toString()
        return if (inputType == NumberAnalysis.ROMAN_NUMERALS || inputType == "base-16") {
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
                }
                analyzeAllRows()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
        outputTypeSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                analyzeAllRows()
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
}
