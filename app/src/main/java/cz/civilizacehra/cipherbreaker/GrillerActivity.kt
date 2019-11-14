package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.preference.PreferenceManager
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.*
import androidx.core.content.ContextCompat

import java.util.Locale

class GrillerActivity : Activity() {

    private val sharedPreferences by lazy { PreferenceManager.getDefaultSharedPreferences(this) }

    private val grilleInputLayout by lazy { findViewById<RelativeLayout>(R.id.grilleInputLayout) }

    private val sizeSpinner by lazy { findViewById<Spinner>(R.id.sizeSpinner) }
    private val sizeLayout by lazy { findViewById<RelativeLayout>(R.id.sizeLayout) }

    private val resultView by lazy { findViewById<TextView>(R.id.resultTextView) }

    private var size = 0
    private var grille: Array<Array<EditText>>? = null

    private val grilleColors by lazy { arrayOf(
            ContextCompat.getColor(applicationContext, android.R.color.white),
            ContextCompat.getColor(applicationContext, R.color.colorPrimaryLight),
            ContextCompat.getColor(applicationContext, R.color.lightGray),
            ContextCompat.getColor(applicationContext, R.color.gray)
    ) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_griller)

        loadSavedState()
        computeGrid()

        sizeSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                reloadGrille()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        sizeLayout.setOnClickListener{ sizeSpinner.performClick() }

        loadSavedState()
        computeGrid()
    }

    private fun computeGrid() {
        try {
            var presets = arrayOf<Pair<Int, Int>>()
            for (i in 0 until size) {
                for (j in 0 until size) {
                    val tag = grille!![i][j].tag as Int
                    if (tag == 1) {
                        presets += Pair(i, j)
                    }
                }
            }
            if (presets.size != desiredPresets()) {
                val msg = "Insufficient reading positions specified. Specify them through long tap."
                resultView.text = msg
                return
            }
            var text = ""
            for (rot in 0 until 4) {
                val indices = Array(presets.size) { i -> getRotation(presets[i].first, presets[i].second, rot) }
                val sortedIndices = indices.sortedWith(compareBy({ it.first }, { it.second }))
                for (index in sortedIndices) {
                    text += grille!![index.first][index.second].text.toString()
                }
                text += "\n"
            }
            resultView.text = text
        } catch (e: Throwable) {
            applicationContext.toastIt("Error calculating grid ${e.message}")
        }
    }

    private fun getRotation(i: Int, j: Int, rotation: Int): Pair<Int, Int> {
        return when(rotation % 4) {
            0 -> Pair(i, j)
            1 -> Pair(j, size - i - 1)
            2 -> Pair(size - i - 1, size - j - 1)
            3 -> Pair(size - j - 1, i)
            else -> {
                applicationContext.toastIt("Internal error, invalid rotation")
                Pair(i, j)
            }
        }
    }

    private fun getRotations(i: Int, j: Int): Array<Pair<Int, Int>> {
        return Array(4) { rot -> getRotation(i, j, rot) }
    }

    private fun reloadGrille() {
        val split = sizeSpinner.selectedItem.toString().split("x")
        if (split.size != 2 || split[0] != split[1]) {
            applicationContext.toastIt("Invalid size input")
        }
        size = split[0].toInt()

        val tableLayout = TableLayout(this)
        val margin = applicationContext.resources.displayMetrics.density.toInt()
        val wrapContent = RelativeLayout.LayoutParams.WRAP_CONTENT

        grille = Array(size) { Array(size) { EditText(this) } }
        val dimensions = applicationContext.resources.displayMetrics.widthPixels / 11
        for (i in 0 until size) {
            val tableRow = TableRow(this)
            tableRow.layoutParams
            for (j in 0 until size) {
                val cell = grille!![i][j]
                cell.width = dimensions
                cell.height = dimensions
                // TODO make cell rectangular
                if (size % 2 == 1 && i == j && 2*i + 1 == size) {
                    cell.tag = 3
                    cell.setBackgroundColor(grilleColors[3])
                    cell.isEnabled = false
                } else {
                    cell.tag = 2
                    cell.setBackgroundColor(grilleColors[2])
                    cell.inputType = InputType.TYPE_CLASS_TEXT or EditorInfo.TYPE_TEXT_FLAG_CAP_CHARACTERS
                    cell.setSelectAllOnFocus(true)
                    cell.gravity = Gravity.CENTER_HORIZONTAL
                    cell.textSize = dimensions / 5.toFloat()

                    fun goToNextCell() {
                        val next = nextCell(i, j)
                        if (next.first == size) {
                            val inputManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                            inputManager.hideSoftInputFromWindow(currentFocus!!.windowToken, InputMethodManager.HIDE_NOT_ALWAYS)
                        } else {
                            grille!![next.first][next.second].requestFocus()
                        }
                    }
                    fun goToPrevCell() {
                        val prev = prevCell(i, j)
                        if (prev.first == -1) {
                            val inputManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                            inputManager.hideSoftInputFromWindow(currentFocus!!.windowToken, InputMethodManager.HIDE_NOT_ALWAYS)
                        } else {
                            grille!![prev.first][prev.second].requestFocus()
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
                        setState(i, j)
                        return@setOnLongClickListener true
                    }
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

        grilleInputLayout.removeAllViewsInLayout()
        grilleInputLayout.addView(envelopingLayout)

        computeGrid()
    }

    private fun isCenterCell(i: Int, j: Int): Boolean {
        return size % 2 == 1 && i == j && 2*i + 1 == size
    }

    private fun nextCell(i: Int, j: Int): Pair<Int, Int> {
        var nextJ = (j + 1) % size
        val nextI = if (nextJ == 0) i + 1 else i
        if (isCenterCell(nextI, nextJ)) {
            nextJ += 1
        }
        return Pair(nextI, nextJ)
    }

    private fun prevCell(i: Int, j: Int): Pair<Int, Int> {
        var prevJ = (j - 1 + size) % size
        val prevI = if (j == 0) i - 1 else i
        if (isCenterCell(prevI, prevJ)) {
            prevJ -= 1
        }
        return Pair(prevI, prevJ)
    }

    private fun setState(i: Int, j: Int) {
        val cell = grille!![i][j]
        val rotations = getRotations(i, j)
        if (cell.tag as Int == 1) {
            for (yx in rotations) {
                val currCell = grille!![yx.first][yx.second]
                currCell.tag = 2
                currCell.setBackgroundColor(grilleColors[2])
            }
        } else {
            cell.tag = 1
            cell.setBackgroundColor(grilleColors[1])
            for (k in 1 until 4) {
                val yx = rotations[k]
                val currCell = grille!![yx.first][yx.second]
                currCell.tag = 0
                currCell.setBackgroundColor(grilleColors[0])

            }
        }
        computeGrid()
    }

    private fun desiredPresets(): Int {
        var desiredPresets = size * size
        if (size % 2 == 1) {
            desiredPresets -= 1
        }
        return desiredPresets / 4
    }

    private fun saveState() {
        val editor = sharedPreferences.edit()
        var isEmpty = true
        var letters = ""
        var holes = ""
        for (i in 0 until size) {
            for (j in 0 until size) {
                val cell = grille!![i][j]
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
                val tag = cell.tag as Int
                if (tag < 2) {
                    isEmpty = false
                }
                holes += tag.toString()
            }
        }
        if (isEmpty) {
            editor.remove("sizeSpinner")
            editor.remove("inputLetters")
            editor.remove("inputHoles")
        } else {
            editor.putInt("sizeSpinner", sizeSpinner.selectedItemPosition)
            editor.putString("inputLetters", letters)
            editor.putString("inputHoles", holes)
        }
        editor.apply()
    }

    private fun loadSavedState() {
        val sizeSpinnerIndex = sharedPreferences.getInt("sizeSpinner", 0)
        val inputLetters = sharedPreferences.getString("inputLetters", "kcuerloulmnyutsv")
        val inputHoles = sharedPreferences.getString("inputHoles",     "0101000000100100")
        sizeSpinner.setSelection(sizeSpinnerIndex, false)
        reloadGrille()
        if (inputHoles!!.length != size*size || inputLetters!!.length != size*size) {
            applicationContext.toastIt("Invalid saved state, not loading. (${inputHoles.length} ${inputLetters!!.length} ${size*size}")
            return
        }
        for (i in 0 until size) {
            for (j in 0 until size) {
                val cell = grille!![i][j]
                val inputLetter = inputLetters[i*size + j].toString().toUpperCase(Locale.ENGLISH)
                if (inputLetter != "_") {
                    cell.setText(inputLetter)
                }
                val tag = inputHoles[i*size + j].toString().toInt()
                if (tag < 0 || tag > 3) {
                    applicationContext.toastIt("Invalid cell state $tag")
                    return
                }
                cell.tag = tag
                cell.setBackgroundColor(grilleColors[tag])
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()

        saveState()
    }
}
