package cz.civilizacehra.cipherbreaker

import android.content.Context
import android.content.SharedPreferences
import android.location.LocationManager
import android.preference.PreferenceManager
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.RadioGroup
import android.widget.TextView
import cz.civilizacehra.cipherbreaker.Dictionary
import java.util.*

import java.util.regex.PatternSyntaxException

class PresmyslovnikActivity : LocationActivity() {

    private var sharedPreferences: SharedPreferences? = null

    private var goBtn: Button? = null
    private var inputBox: EditText? = null
    private var minLengthBox: EditText? = null
    private var maxLengthBox: EditText? = null
    internal var results: TextView? = null
    internal var mode: RadioGroup? = null
    internal var source: RadioGroup? = null
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
        mode = findViewById(R.id.modeRadioGrp)
        source = findViewById(R.id.sourceRadioGrp)
        svjz = findViewById(R.id.svjzCheckBox)

        source!!.setOnCheckedChangeListener { _, id ->
            when (id) {
                R.id.mapBrnoRadioBtn, R.id.mapPragueRadioBtn -> if (mLocation == null) {
                    acquireLocation()
                }
            }
            refreshSvjz(id, mode!!.checkedRadioButtonId)
        }

        mode!!.setOnCheckedChangeListener { _, id -> refreshSvjz(source!!.checkedRadioButtonId, id) }

        loadRadioButtons()
        refreshSvjz(source!!.checkedRadioButtonId, mode!!.checkedRadioButtonId)

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

        if (goBtn != null) {
            goBtn!!.setOnClickListener { searchDictionary() }
        }
    }

    private fun saveRadioButtons() {
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this)
        val editor = sharedPreferences!!.edit()
        editor.putInt("modeRadioButton", mode!!.checkedRadioButtonId)
        editor.putInt("sourceRadioButton", source!!.checkedRadioButtonId)
        editor.apply()
    }

    private fun loadRadioButtons() {
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this)
        mode!!.check(sharedPreferences!!.getInt("modeRadioButton", mode!!.checkedRadioButtonId))
        source!!.check(sharedPreferences!!.getInt("sourceRadioButton", source!!.checkedRadioButtonId))
    }

    private fun refreshSvjz(sourceId: Int, modeId: Int) {
        svjz!!.isEnabled = (sourceId == R.id.mapBrnoRadioBtn || sourceId == R.id.mapPragueRadioBtn) && (modeId == R.id.exactRadioBtn || modeId == R.id.supersetRadioBtn)
    }

    private fun searchDictionary() {
        val inputManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        inputManager.hideSoftInputFromWindow(Objects.requireNonNull(currentFocus).windowToken, InputMethodManager.HIDE_NOT_ALWAYS)

        val modeId = mode!!.checkedRadioButtonId
        var minLength = 0
        if (minLengthBox!!.text.isNotEmpty()) {
            minLength = Integer.parseInt(minLengthBox!!.text.toString())
        }
        var maxLength = 100
        if (maxLengthBox!!.text.isNotEmpty()) {
            maxLength = Integer.parseInt(maxLengthBox!!.text.toString())
        }
        results!!.text = "Result:\n"

        val checkedDictionary = source!!.checkedRadioButtonId
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
            when (checkedDictionary) {
                R.id.enRadioBtn -> findResults(enDict!!)
                R.id.czPJRadioBtn -> findResults(czPJDict!!)
                R.id.czRadioBtn -> findResults(czDict!!)
                R.id.czBigRadioBtn -> findResults(czBigDict!!)
                R.id.mapBrnoRadioBtn -> findResultsInMap(brnoMap!!)
                R.id.mapPragueRadioBtn -> findResultsInMap(pragueMap!!)
                else -> {
                    Utils.toastIt(applicationContext, "No dictionary selected")
                    return
                }
            }
        } catch (e: PatternSyntaxException) {
            Utils.toastIt(applicationContext, "Invalid regex syntax")
        } catch (e: Throwable) {
            Utils.toastIt(applicationContext, "Unknown error")
        }

        saveRadioButtons()
    }
}
