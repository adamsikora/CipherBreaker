package cz.civilizacehra.cipherbreaker

import android.content.Context
import android.preference.PreferenceManager
import android.os.Bundle
import android.text.InputType
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.*
import kotlinx.android.synthetic.main.activity_presmyslovnik.*
import java.util.*

import java.util.regex.PatternSyntaxException

class PresmyslovnikActivity : LocationActivity() {

    private val sharedPreferences by lazy {PreferenceManager.getDefaultSharedPreferences(this)}

    private val goBtn by lazy {findViewById<Button>(R.id.GoBtn)}
    private val inputBox by lazy {findViewById<EditText>(R.id.inputEditText)}
    private val minLengthBox by lazy {findViewById<EditText>(R.id.minEditText)}
    private val maxLengthBox by lazy {findViewById<EditText>(R.id.maxEditText)}
    internal val results by lazy {findViewById<TextView>(R.id.resultTextView)}
    private val modeSpinner by lazy {findViewById<Spinner>(R.id.modeSpinner)}
    private val dictionarySpinner by lazy {findViewById<Spinner>(R.id.dictionarySpinner)}
    private val svjz by lazy {findViewById<CheckBox>(R.id.svjzCheckBox)}

    private var enDict: Dictionary? = null
    private var czPJDict: Dictionary? = null
    private var czDict: Dictionary? = null
    private var czBigDict: Dictionary? = null
    private var pragueMap: MapDictionary? = null
    private var brnoMap: MapDictionary? = null
    private var czechiaMap: MapDictionary? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_presmyslovnik)

        dictionarySpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View, position: Int, id: Long) {
                if (position in 4..6 && mLocation == null) {
                    acquireLocation()
                }
                refreshSvjz()
            }

            override fun onNothingSelected(parent: AdapterView<*>) {}
        }

        modeSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View, position: Int, id: Long) {
                refreshSvjz()
                inputEditText.inputType = if (position >= 6) InputType.TYPE_CLASS_NUMBER else InputType.TYPE_CLASS_TEXT
            }

            override fun onNothingSelected(parent: AdapterView<*>) {}
        }

        loadSavedState()
        refreshSvjz()

        enDict = Dictionary(applicationContext, "en.canon", results)
        czPJDict = Dictionary(applicationContext, "podst_jm_cz.canon", results)
        czDict = Dictionary(applicationContext, "cs_CZ_openoffice.canon", results)
        czBigDict = Dictionary(applicationContext, "cs.canon", results)
        pragueMap = MapDictionary(applicationContext, "Prague.cbmap", results)
        brnoMap = MapDictionary(applicationContext, "Brno.cbmap", results)
        czechiaMap = MapDictionary(applicationContext, "Czechia.cbmap", results)

        inputBox.setOnKeyListener(View.OnKeyListener { _, keyCode, event ->
            // If the event is a key-down event on the "enter" button
            if (event.action == KeyEvent.ACTION_DOWN && keyCode == KeyEvent.KEYCODE_ENTER) {
                searchDictionary()
                return@OnKeyListener true
            }
            false
        })

        inputBox.requestFocus()

        goBtn.setOnClickListener { searchDictionary() }
    }

    private fun saveState() {
        val editor = sharedPreferences.edit()
        editor.putInt("modeSpinner", modeSpinner.selectedItemPosition)
        editor.putInt("dictionarySpinner", dictionarySpinner.selectedItemPosition)
        editor.apply()
    }

    private fun loadSavedState() {
        modeSpinner.setSelection(sharedPreferences.getInt("modeSpinner", 0))
        dictionarySpinner.setSelection(sharedPreferences.getInt("dictionarySpinner", 0))
    }

    private fun refreshSvjz() {
        val dictionaryPosition = dictionarySpinner.selectedItemPosition
        val modePosition = modeSpinner.selectedItemPosition
        svjz.isEnabled = dictionaryPosition in 4..6 && modePosition in 2..3
    }

    private fun searchDictionary() {
        val inputManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        inputManager.hideSoftInputFromWindow(Objects.requireNonNull(currentFocus).windowToken, InputMethodManager.HIDE_NOT_ALWAYS)

        val modeId = modeSpinner.selectedItemPosition
        var minLength = 0
        if (minLengthBox.text.isNotEmpty()) {
            minLength = Integer.parseInt(minLengthBox.text.toString())
        }
        var maxLength = 100
        if (maxLengthBox.text.isNotEmpty()) {
            maxLength = Integer.parseInt(maxLengthBox.text.toString())
        }
        results.text = "Result:\n"

        val input = inputBox.text.toString().toLowerCase(Locale.ENGLISH)

        val findResults = fun(dict: Dictionary) { dict.findResults(input, modeId, minLength, maxLength)}
        val findResultsInMap = fun(map: MapDictionary) {
            if (mLocation == null) {
                acquireLocation()
            }
            map.setSvjz(svjz.isEnabled && svjz.isChecked)
            map.setLocation(mLocation!!)
            map.findResults(input, modeId, minLength, maxLength)
        }

        try {
            when (dictionarySpinner.selectedItemPosition) {
                0 -> findResults(enDict!!)
                1 -> findResults(czPJDict!!)
                2 -> findResults(czDict!!)
                3 -> findResults(czBigDict!!)
                4 -> findResultsInMap(pragueMap!!)
                5 -> findResultsInMap(brnoMap!!)
                6 -> findResultsInMap(czechiaMap!!)
                else -> {
                    Utils.toastIt(applicationContext, "No dictionary selected")
                    return
                }
            }
        } catch (e: PatternSyntaxException) {
            Utils.toastIt(applicationContext, "Invalid regex syntax")
        } catch (e: Throwable) {
            Utils.toastIt(applicationContext, "Unknown error ${e.message}")
        }

        saveState()
    }

    override fun onDestroy() {
        super.onDestroy()

        saveState()
    }
}
