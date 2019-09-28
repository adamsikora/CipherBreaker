package cz.civilizacehra.cipherbreaker

import android.content.Context
import android.content.SharedPreferences
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

    private var sharedPreferences: SharedPreferences? = null

    private var goBtn: Button? = null
    private var inputBox: EditText? = null
    private var minLengthBox: EditText? = null
    private var maxLengthBox: EditText? = null
    internal var results: TextView? = null
    private var modeSpinner: Spinner? = null
    private var dictionarySpinner: Spinner? = null
    private var svjz: CheckBox? = null

    private var enDict: Dictionary? = null
    private var czPJDict: Dictionary? = null
    private var czDict: Dictionary? = null
    private var czBigDict: Dictionary? = null
    private var pragueMap: MapDictionary? = null
    private var brnoMap: MapDictionary? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_presmyslovnik)

        goBtn = findViewById(R.id.GoBtn)
        inputBox = findViewById(R.id.inputEditText)
        minLengthBox = findViewById(R.id.minEditText)
        maxLengthBox = findViewById(R.id.maxEditText)
        results = findViewById(R.id.resultTextView)
        modeSpinner = findViewById(R.id.modeSpinner)
        dictionarySpinner = findViewById(R.id.dictionarySpinner)
        svjz = findViewById(R.id.svjzCheckBox)

        val dictionarySpinnerListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View, position: Int, id: Long) {
                if (position in 4..5 && mLocation == null) {
                    acquireLocation()
                }
                refreshSvjz()
            }

            override fun onNothingSelected(parent: AdapterView<*>) {}
        }

        dictionarySpinner!!.onItemSelectedListener = dictionarySpinnerListener


        val modeSpinnerListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View, position: Int, id: Long) {
                refreshSvjz()
                inputEditText.inputType = if (position >= 6) InputType.TYPE_CLASS_NUMBER else InputType.TYPE_CLASS_TEXT
            }

            override fun onNothingSelected(parent: AdapterView<*>) {}
        }

        modeSpinner!!.onItemSelectedListener = modeSpinnerListener

        loadSavedState()
        refreshSvjz()

        enDict = Dictionary(applicationContext, "en.canon", results!!)
        czPJDict = Dictionary(applicationContext, "podst_jm_cz.canon", results!!)
        czDict = Dictionary(applicationContext, "cs_CZ_openoffice.canon", results!!)
        czBigDict = Dictionary(applicationContext, "cs.canon", results!!)
        brnoMap = MapDictionary(applicationContext, "map_brno.sifrohal", results!!)
        pragueMap = MapDictionary(applicationContext, "map_prague.sifrohal", results!!)

        inputBox!!.setOnKeyListener(View.OnKeyListener { _, keyCode, event ->
            // If the event is a key-down event on the "enter" button
            if (event.action == KeyEvent.ACTION_DOWN && keyCode == KeyEvent.KEYCODE_ENTER) {
                searchDictionary()
                return@OnKeyListener true
            }
            false
        })

        inputBox!!.requestFocus()

        goBtn!!.setOnClickListener { searchDictionary() }
    }

    private fun saveState() {
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this)
        val editor = sharedPreferences!!.edit()
        editor.putInt("modeSpinner", modeSpinner!!.selectedItemPosition)
        editor.putInt("dictionarySpinner", dictionarySpinner!!.selectedItemPosition)
        editor.apply()
    }

    private fun loadSavedState() {
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this)
        modeSpinner!!.setSelection(sharedPreferences!!.getInt("modeSpinner", 0))
        dictionarySpinner!!.setSelection(sharedPreferences!!.getInt("dictionarySpinner", 0))
    }

    private fun refreshSvjz() {
        val dictionaryPosition = dictionarySpinner!!.selectedItemPosition
        val modePosition = modeSpinner!!.selectedItemPosition
        svjz!!.isEnabled = dictionaryPosition in 4..5 && modePosition in 2..3
    }

    private fun searchDictionary() {
        val inputManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        inputManager.hideSoftInputFromWindow(Objects.requireNonNull(currentFocus).windowToken, InputMethodManager.HIDE_NOT_ALWAYS)

        val modeId = modeSpinner!!.selectedItemPosition
        var minLength = 0
        if (minLengthBox!!.text.isNotEmpty()) {
            minLength = Integer.parseInt(minLengthBox!!.text.toString())
        }
        var maxLength = 100
        if (maxLengthBox!!.text.isNotEmpty()) {
            maxLength = Integer.parseInt(maxLengthBox!!.text.toString())
        }
        results!!.text = "Result:\n"

        val input = inputBox!!.text.toString().toLowerCase(Locale.ENGLISH)

        val findResults = fun(dict: Dictionary) { dict.findResults(input, modeId, minLength, maxLength)}
        val findResultsInMap = fun(map: MapDictionary) {
            if (mLocation == null) {
                acquireLocation()
            }
            map.setSvjz(svjz!!.isEnabled && svjz!!.isChecked)
            map.setLocation(mLocation!!)
            map.findResults(input, modeId, minLength, maxLength)
        }

        try {
            when (dictionarySpinner!!.selectedItemPosition) {
                0 -> findResults(enDict!!)
                1 -> findResults(czPJDict!!)
                2 -> findResults(czDict!!)
                3 -> findResults(czBigDict!!)
                4 -> findResultsInMap(pragueMap!!)
                5 -> findResultsInMap(brnoMap!!)
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
