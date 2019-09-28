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

    private val dict: Dictionary by lazy {Dictionary(applicationContext)}
    private val mapDict: MapDictionary by lazy {MapDictionary(applicationContext)}

    private val dictionaries = arrayOf(
            "en.canon",
            "podst_jm_cz.canon",
            "cs_CZ_openoffice.canon",
            "cs.canon",
            "Prague.cbmap",
            "Brno.cbmap",
            "Czechia.cbmap"
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_presmyslovnik)

        dictionarySpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View, position: Int, id: Long) {
                if (isMapDictionaryChosen() && mLocation == null) {
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
        val modePosition = modeSpinner.selectedItemPosition
        svjz.isEnabled = isMapDictionaryChosen() && modePosition in 2..3
    }

    private fun searchDictionary() {
        val inputManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        inputManager.hideSoftInputFromWindow(Objects.requireNonNull(currentFocus).windowToken, InputMethodManager.HIDE_NOT_ALWAYS)

        val modeId = modeSpinner.selectedItemPosition
        val minLength = Utils.parseIntWithDefault(minLengthBox.text.toString(), 0)
        val maxLength = Utils.parseIntWithDefault(maxLengthBox.text.toString(), Int.MAX_VALUE)
        results.text = getString(R.string.result)

        val input = inputBox.text.toString().toLowerCase(Locale.ENGLISH)
        val dictName = dictionaries[dictionarySpinner.selectedItemPosition]
        try {
            if (isMapDictionaryChosen()) {
                if (mLocation == null) {
                    acquireLocation()
                } else {
                    mapDict.setLocation(mLocation!!)
                }
                mapDict.setSvjz(svjz.isEnabled && svjz.isChecked)
                results.text = mapDict.findResults(input, modeId, minLength, maxLength, dictName)
            } else {
                results.text = dict.findResults(input, modeId, minLength, maxLength, dictName)
            }
        } catch (e: PatternSyntaxException) {
            Utils.toastIt(applicationContext, "Invalid regex syntax")
        } catch (e: Throwable) {
            Utils.toastIt(applicationContext, "Unknown error ${e.message}")
        }

        saveState()
    }

    private fun isMapDictionaryChosen(): Boolean {
        return dictionarySpinner.selectedItemPosition in 4..6
    }

    override fun onDestroy() {
        super.onDestroy()

        saveState()
    }
}
