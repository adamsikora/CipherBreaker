package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.content.Context
import android.location.Location
import android.preference.PreferenceManager
import android.os.Bundle
import android.text.InputType
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.*
import com.google.android.gms.maps.model.LatLng
import kotlinx.android.synthetic.main.activity_presmyslovnik.*
import kotlinx.coroutines.*
import java.util.*
import android.content.Intent


class PresmyslovnikActivity : LocationActivity() {

    private val sharedPreferences by lazy { PreferenceManager.getDefaultSharedPreferences(this) }

    private val goBtn by lazy { findViewById<Button>(R.id.GoBtn) }
    private val inputBox by lazy { findViewById<EditText>(R.id.inputEditText) }
    private val minLengthBox by lazy { findViewById<EditText>(R.id.minEditText) }
    private val maxLengthBox by lazy { findViewById<EditText>(R.id.maxEditText) }
    private val modeSpinner by lazy { findViewById<Spinner>(R.id.modeSpinner) }
    private val dictionarySpinner by lazy { findViewById<Spinner>(R.id.dictionarySpinner) }
    private val modeLayout by lazy { findViewById<RelativeLayout>(R.id.modeLayout) }
    private val dictionaryLayout by lazy { findViewById<RelativeLayout>(R.id.dictionaryLayout) }
    private val svjz by lazy { findViewById<CheckBox>(R.id.svjzCheckBox) }

    private val positionLayout by lazy { findViewById<RelativeLayout>(R.id.positionLayout) }
    private val positionTextView by lazy { findViewById<TextView>(R.id.positionCoordinatesView) }
    private val pickFromMapIcon by lazy { findViewById<RelativeLayout>(R.id.pickFromMapIconLayout) }
    private val currentLocationIcon by lazy { findViewById<RelativeLayout>(R.id.currLocationIconLayout) }

    private val countView by lazy { findViewById<TextView>(R.id.countValueView) }
    private val timeView by lazy { findViewById<TextView>(R.id.timeValueView) }
    private val progressBar by lazy { findViewById<ProgressBar>(R.id.progressBar) }

    private val resultView by lazy { findViewById<TextView>(R.id.resultTextView) }

    private var mJob: Job = Job()

    private val dict: Dictionary by lazy { Dictionary(applicationContext) }
    private val mapDict: MapDictionary by lazy { MapDictionary(applicationContext) }

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
                showPositionLayout()
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

        dictionaryLayout.setOnClickListener{ dictionarySpinner.performClick() }
        modeLayout.setOnClickListener{ modeSpinner.performClick() }

        loadSavedState()
        showPositionLayout()
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

        pickFromMapIcon.setOnClickListener {
            val intent = Intent(this@PresmyslovnikActivity, PickFromMapActivity::class.java)
            if (mLocation != null) {
                val bundle = Bundle()
                bundle.putDouble("latitude", mLocation!!.latitude)
                bundle.putDouble("longitude", mLocation!!.longitude)
                intent.putExtras(bundle)
            }
            this@PresmyslovnikActivity.startActivityForResult(intent, 1)
        }
        currentLocationIcon.setOnClickListener { acquireLocation() }
    }

    private fun saveState() {
        val editor = sharedPreferences.edit()
        editor.putInt("modeSpinner", modeSpinner.selectedItemPosition)
        editor.putInt("dictionarySpinner", dictionarySpinner.selectedItemPosition)
        editor.putString("minLength", minLengthBox.text.toString())
        editor.putString("maxLength", maxLengthBox.text.toString())
        editor.putString("query", inputBox.text.toString())
        editor.apply()
    }

    private fun loadSavedState() {
        modeSpinner.setSelection(sharedPreferences.getInt("modeSpinner", 0))
        dictionarySpinner.setSelection(sharedPreferences.getInt("dictionarySpinner", 0))
        minLengthBox.setText(sharedPreferences.getString("minLength", ""))
        maxLengthBox.setText(sharedPreferences.getString("maxLength", ""))
        inputBox.setText(sharedPreferences.getString("query", ""))
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
        GlobalScope.launch(Dispatchers.Main) {
            if (mJob.isActive) {
                mJob.cancelAndJoin()
            }
            mJob = GlobalScope.launch(Dispatchers.Main) {
                progressBar.progress = 0
                progressBar.visibility = View.VISIBLE
                try {
                    withContext(Dispatchers.Default) {
                        val uiHandlers = UiHandlers(
                                { text ->
                                    withContext(Dispatchers.Main) {
                                        applicationContext.toastIt(text)
                                    }
                                },
                                { progress, count, time, result ->
                                    withContext(Dispatchers.Main) {
                                        updateProgress(progress, count, time, result)
                                    }
                                }
                        )
                        dict.findResults(input, queryParams, dictInfo, uiHandlers)
                        progressBar.visibility = View.INVISIBLE
                    }
                } catch (e: Throwable) {
                    if (e is CancellationException) {
                        throw e
                    } else {
                        applicationContext.toastIt("Unknown error ${e.message}")
                    }
                }
            }
        }
    }

    private fun updateProgress(progress: Int, count: Int, time: Double, result: String) {
        progressBar.progress = progress
        countView.text = count.toString()
        timeView.text = String.format(Locale.ENGLISH, "%.3f", time)
        resultView.text = result
    }

    private fun isMapDictionaryChosen(): Boolean {
        return dictionarySpinner.selectedItemPosition in 4..6
    }

    private fun showPositionLayout() {
        if (isMapDictionaryChosen()) {
            positionLayout.visibility = View.VISIBLE
        } else {
            positionLayout.visibility = View.GONE
        }
    }

    override fun onLocationChanged(location: Location) {
        positionTextView.text = Utils.formatLatLng(LatLng(location.latitude, location.longitude))
        super.onLocationChanged(location)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 1) {
            if (resultCode == Activity.RESULT_OK) {
                val lat = data!!.getDoubleExtra("selectedLatitude", 0.0)
                val lon = data.getDoubleExtra("selectedLongitude", 0.0)
                if (lat != 0.0 && lon != 0.0) {
                    val selectedLocation = Location("")
                    selectedLocation.latitude = lat
                    selectedLocation.longitude = lon
                    mLocation = selectedLocation
                    positionTextView.text = Utils.formatLatLng(LatLng(lat, lon))
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()

        saveState()
    }
}
