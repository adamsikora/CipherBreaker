package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.os.Bundle
import android.preference.PreferenceManager
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.*
import androidx.core.content.ContextCompat
import androidx.core.content.edit

class PlayfairActivity : Activity() {

    private val sharedPreferences by lazy { PreferenceManager.getDefaultSharedPreferences(this) }

    private val playfairInputLayout by lazy { findViewById<RelativeLayout>(R.id.playfairInputLayout) }

    private val inputEditText by lazy { findViewById<EditText>(R.id.inputEditText) }

    private val widthSpinner by lazy { findViewById<Spinner>(R.id.widthSpinner) }
    private val widthLayout by lazy { findViewById<RelativeLayout>(R.id.widthLayout) }
    private val heightSpinner by lazy { findViewById<Spinner>(R.id.heightSpinner) }
    private val heightLayout by lazy { findViewById<RelativeLayout>(R.id.heightLayout) }

    private val decryptedView by lazy { findViewById<TextView>(R.id.decryptedTextView) }
    private val encryptedView by lazy { findViewById<TextView>(R.id.encryptedTextView) }

    private var width = 0
    private var height = 0
    private var grid: Array<Array<EditText>>? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_playfair)

        loadSavedState()
        computeGrid()

        widthSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                reloadGrid()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
        heightSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                reloadGrid()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        inputEditText.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable) {}
            override fun beforeTextChanged(s: CharSequence, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence, start: Int, before: Int, count: Int) {
                computeGrid()
            }
        })

        widthLayout.setOnClickListener{ widthSpinner.performClick() }
        heightLayout.setOnClickListener{ heightSpinner.performClick() }

        loadSavedState()
        computeGrid()
    }

    private fun computeGrid() {
        try {
            val cells = List(height) { i -> List(width) { j -> grid!![i][j].text.toString() } }
            val text = inputEditText.text.toString()
            val problem = Playfair.findProblem(cells, text)
            if (problem != null) {
                decryptedView.text = problem
                encryptedView.text = problem
                return
            }
            decryptedView.text = Playfair.crypt(cells, text, decrypt=true)
            encryptedView.text = Playfair.crypt(cells, text, decrypt=false)
        } catch (e: Throwable) {
            applicationContext.toastIt("Error calculating grid ${e.message}")
        }
    }

    private fun reloadGrid() {
        width = widthSpinner.selectedItem.toString().toInt()
        height = heightSpinner.selectedItem.toString().toInt()

        val tableLayout = TableLayout(this)
        val margin = applicationContext.resources.displayMetrics.density.toInt()
        val wrapContent = RelativeLayout.LayoutParams.WRAP_CONTENT

        grid = Array(height) { Array(width) { EditText(this) } }
        val dimensions = applicationContext.resources.displayMetrics.widthPixels / 11
        for (i in 0 until height) {
            val tableRow = TableRow(this)
            tableRow.layoutParams
            for (j in 0 until width) {
                val cell = grid!![i][j]
                cell.width = dimensions
                cell.height = dimensions
                cell.inputType = InputType.TYPE_CLASS_TEXT
                cell.setSelectAllOnFocus(true)
                cell.gravity = Gravity.CENTER_HORIZONTAL
                cell.textSize = dimensions / 5.toFloat()
                cell.setBackgroundColor(ContextCompat.getColor(applicationContext, R.color.lightGray))

                fun goToNextCell() {
                    val next = nextCell(i, j)
                    if (next.first == width) {
                        val inputManager = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
                        inputManager.hideSoftInputFromWindow(currentFocus!!.windowToken, InputMethodManager.HIDE_NOT_ALWAYS)
                    } else {
                        grid!![next.first][next.second].requestFocus()
                    }
                }
                fun goToPrevCell() {
                    val prev = prevCell(i, j)
                    if (prev.first == -1) {
                        val inputManager = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
                        inputManager.hideSoftInputFromWindow(currentFocus!!.windowToken, InputMethodManager.HIDE_NOT_ALWAYS)
                    } else {
                        grid!![prev.first][prev.second].requestFocus()
                    }
                }
                cell.setOnKeyListener{ _, keyCode, keyEvent ->
                    when (keyCode) {
                        KeyEvent.KEYCODE_ENTER -> {
                            if (keyEvent.action == KeyEvent.ACTION_UP) {
                                goToNextCell()
                            }
                            true
                        }
                        KeyEvent.KEYCODE_DEL -> {
                            if (keyEvent.action == KeyEvent.ACTION_DOWN && cell.text.isEmpty()) {
                                goToPrevCell()
                                true
                            } else {
                                false
                            }
                        }
                        else -> false
                    }
                }
                cell.addTextChangedListener(object : TextWatcher {
                    override fun afterTextChanged(s: Editable) {}
                    override fun beforeTextChanged(s: CharSequence, start: Int, count: Int, after: Int) {}
                    override fun onTextChanged(s: CharSequence, start: Int, before: Int, count: Int) {
                        computeGrid()
                        if (s.length == 1) {
                            goToNextCell()
                        }
                    }
                })
                cell.setOnLongClickListener {
                    computeGrid()
                    return@setOnLongClickListener true
                }
                val cellLayout = LinearLayout(this)
                val params = TableRow.LayoutParams(wrapContent, wrapContent)
                params.setMargins(margin, margin, margin, margin)
                cellLayout.layoutParams = params
                cellLayout.addView(cell)
                tableRow.addView(cellLayout)
            }
            tableLayout.addView(tableRow)
        }
        val envelopingLayout = LinearLayout(this)
        val params = LinearLayout.LayoutParams(wrapContent, wrapContent)
        params.setMargins(margin, margin, margin, margin)
        tableLayout.layoutParams = params
        envelopingLayout.setBackgroundColor(ContextCompat.getColor(applicationContext, R.color.gray))
        envelopingLayout.addView(tableLayout)

        playfairInputLayout.removeAllViewsInLayout()
        playfairInputLayout.addView(envelopingLayout)

        computeGrid()
    }

    private fun nextCell(i: Int, j: Int): Pair<Int, Int> {
        val nextJ = (j + 1) % width
        val nextI = if (nextJ == 0) i + 1 else i
        return Pair(nextI, nextJ)
    }

    private fun prevCell(i: Int, j: Int): Pair<Int, Int> {
        val prevJ = (j - 1 + width) % width
        val prevI = if (j == 0) i - 1 else i
        return Pair(prevI, prevJ)
    }

    private fun saveState() {
        sharedPreferences.edit {
            var isEmpty = true
            var letters = ""
            for (i in 0 until height) {
                for (j in 0 until width) {
                    val cell = grid!![i][j]
                    var letter = cell.text.toString()
                    if (letter.length > 1) {
                        letter = letter[0].toString()
                    }
                    if (letter.isEmpty()) {
                        letter = "_"
                    } else {
                        isEmpty = false
                    }
                    letters += letter
                }
            }
            if (isEmpty) {
                remove("playfairWidthSpinner")
                remove("playfairHeightSpinner")
                remove("playfairGrid")
                remove("playfairText")
            } else {
                putInt("playfairWidthSpinner", widthSpinner.selectedItemPosition)
                putInt("playfairHeightSpinner", heightSpinner.selectedItemPosition)
                putString("playfairGrid", letters)
                putString("playfairText", inputEditText.text.toString())
            }
        }
    }

    private fun loadSavedState() {
        val playfairWidthIndex = sharedPreferences.getInt("playfairWidthSpinner", 1)
        val playfairHeightIndex = sharedPreferences.getInt("playfairHeightSpinner", 1)
        val playfairGrid = sharedPreferences.getString("playfairGrid", "PLAYFIRBCDEGHJKMNOSTUVWXZ")
        val playfairText = sharedPreferences.getString("playfairText", "LYBLRTKUYODPBNWLSLMKZSDE")

        widthSpinner.setSelection(playfairWidthIndex, false)
        heightSpinner.setSelection(playfairHeightIndex, false)
        reloadGrid()
        if (playfairGrid!!.length != width*height) {
            applicationContext.toastIt("Invalid saved state, not loading. (${playfairGrid.length}, ${width}x${height}")
            return
        }
        for (i in 0 until height) {
            for (j in 0 until width) {
                val cell = grid!![i][j]
                val inputLetter = playfairGrid[i*width + j].toString()
                if (inputLetter != "_") {
                    cell.setText(inputLetter)
                }
            }
        }
        inputEditText.setText(playfairText)
        computeGrid()
    }

    override fun onDestroy() {
        super.onDestroy()

        saveState()
    }
}
