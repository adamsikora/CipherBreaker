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
import kotlinx.coroutines.*
import java.util.*

class PresmyslovnikActivity : LocationActivity() {

    private val sharedPreferences by lazy {PreferenceManager.getDefaultSharedPreferences(this)}

    private val goBtn by lazy {findViewById<Button>(R.id.GoBtn)}
    private val inputBox by lazy {findViewById<EditText>(R.id.inputEditText)}
    private val minLengthBox by lazy {findViewById<EditText>(R.id.minEditText)}
    private val maxLengthBox by lazy {findViewById<EditText>(R.id.maxEditText)}
    private val modeSpinner by lazy {findViewById<Spinner>(R.id.modeSpinner)}
    private val dictionarySpinner by lazy {findViewById<Spinner>(R.id.dictionarySpinner)}
    private val svjz by lazy {findViewById<CheckBox>(R.id.svjzCheckBox)}

    private val countView by lazy {findViewById<TextView>(R.id.countValueView)}
    private val timeView by lazy {findViewById<TextView>(R.id.timeValueView)}
    private val progressBar by lazy {findViewById<ProgressBar>(R.id.progressBar)}

    private val resultView by lazy {findViewById<TextView>(R.id.resultTextView)}

    private var mJob: Job = Job()

    private val dict: Dictionary by lazy {Dictionary(applicationContext)}
    private val mapDict: MapDictionary by lazy {MapDictionary(applicationContext)}

    private val dictionaries = arrayOf(
            DictInfo("en.canon", 88955),
            DictInfo("podst_jm_cz.canon", 23219),
            DictInfo("cs_CZ_openoffice.canon", 166566),
            DictInfo("cs.canon", 4269351),
            DictInfo("Prague.cbmap", 35874),
            DictInfo("Brno.cbmap", 12842),
            DictInfo("Czechia.cbmap", 366663)
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_presmyslovnik)

        dictionarySpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                if (isMapDictionaryChosen() && mLocation == null) {
                    acquireLocation()
                }
                refreshSvjz()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        modeSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                refreshSvjz()
                inputEditText.inputType = if (position >= 6) InputType.TYPE_CLASS_NUMBER else InputType.TYPE_CLASS_TEXT
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
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
        inputManager.hideSoftInputFromWindow(currentFocus!!.windowToken, InputMethodManager.HIDE_NOT_ALWAYS)

        val modeId = modeSpinner.selectedItemPosition
        val minLength = Utils.parseIntWithDefault(minLengthBox.text.toString(), 0)
        val maxLength = Utils.parseIntWithDefault(maxLengthBox.text.toString(), Int.MAX_VALUE)
        if (minLength > maxLength) {
            val msg = "Min lenght ($minLength) is greater than max length ($maxLength). Aborting calculation"
            applicationContext.toastIt(msg)
            return
        }
        val queryParams = QueryParams(modeId, minLength, maxLength)

        val input = inputBox.text.toString().toLowerCase(Locale.ENGLISH)
        val dictInfo = dictionaries[dictionarySpinner.selectedItemPosition]

        if (isMapDictionaryChosen()) {
            if (mLocation == null) {
                acquireLocation()
            } else {
                mapDict.setLocation(mLocation!!)
            }
            mapDict.setSvjz(svjz.isEnabled && svjz.isChecked)
        }
        val currentDict = if (isMapDictionaryChosen()) mapDict else dict

        saveState()

        asynchronousSearch(currentDict, input, queryParams, dictInfo)
    }

    private fun asynchronousSearch(dict: Dictionary, input: String, queryParams: QueryParams, dictInfo: DictInfo) {
        progressBar.progress = 0
        progressBar.visibility = View.VISIBLE
        if (mJob.isActive) {
            mJob.cancel()
            // TODO make sure job got cancelled
        }
        mJob = GlobalScope.launch(Dispatchers.Main) {
            var text = ""
            try {
                withContext(Dispatchers.Default) {
                    val uiHandlers = UiHandlers(
                            { text -> withContext(Dispatchers.Main) {
                                    applicationContext.toastIt(text)
                                }
                            },
                            { progress, count, time -> withContext(Dispatchers.Main) {
                                    updateProgress(progress, count, time)
                                }
                            }
                    )
                    text = dict.findResults(input, queryParams, dictInfo, uiHandlers)
                }
            } catch (e: Throwable) {
                applicationContext.toastIt("Unknown error ${e.message}")
            }
            progressBar.visibility = View.INVISIBLE
            resultView.text = text
        }
    }

    private fun updateProgress(progress: Int, count: Int, time: Double) {
        progressBar.progress = progress
        countView.text = count.toString()
        timeView.text = String.format(Locale.ENGLISH, "%.3f", time)
    }

    private fun isMapDictionaryChosen(): Boolean {
        return dictionarySpinner.selectedItemPosition in 4..6
    }

    override fun onDestroy() {
        super.onDestroy()

        saveState()
    }
}
