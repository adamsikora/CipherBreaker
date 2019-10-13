package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.view.WindowManager
import android.widget.AdapterView
import android.widget.EditText
import android.widget.Spinner
import android.widget.Switch
import android.widget.TextView

import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.util.ArrayList
import java.util.Calendar
import java.util.Collections
import java.util.regex.Pattern
import java.util.regex.PatternSyntaxException

class CalendarActivity : Activity() {


    private val daySpinner by lazy { findViewById<Spinner>(R.id.daySpinner) }
    private val monthSpinner by lazy { findViewById<Spinner>(R.id.monthSpinner) }
    private val dayOfWeekSpinner by lazy { findViewById<Spinner>(R.id.dayOfWeekSpinner) }

    private val sortBySwitch by lazy { findViewById<Switch>(R.id.sortBySwitch) }

    private val yearEditText by lazy { findViewById<EditText>(R.id.yearEditText) }
    private val queryEditText by lazy { findViewById<EditText>(R.id.queryEditText) }

    private val holidaysTextView by lazy { findViewById<TextView>(R.id.holidaysTextView) }

    internal val holidays by lazy { loadHolidays() }

    private val sortByName: Boolean
        get() = sortBySwitch.isChecked

    private val year: Int
        get() = Utils.parseIntWithDefault(yearEditText.text.toString())
    private val month: Int
        get() = Utils.parseIntWithDefault(monthSpinner.selectedItem.toString())
    private val day: Int
        get() = Utils.parseIntWithDefault(daySpinner.selectedItem.toString())
    private val dayOfWeek: String
        get() = dayOfWeekSpinner.selectedItem.toString()
    private val query: String
        get() = queryEditText.text.toString()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        this.window.setSoftInputMode(
                WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN)
        setContentView(R.layout.activity_calendar)

        yearEditText.setText(Calendar.getInstance().get(Calendar.YEAR).toString())

        updateHolidays()

        val spinnerListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                updateHolidays()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        daySpinner.onItemSelectedListener = spinnerListener
        monthSpinner.onItemSelectedListener = spinnerListener
        dayOfWeekSpinner.onItemSelectedListener = spinnerListener

        sortBySwitch.setOnCheckedChangeListener { _, _ -> updateHolidays() }

        yearEditText.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable) {}
            override fun beforeTextChanged(s: CharSequence, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence, start: Int, before: Int, count: Int) {
                updateHolidays()
            }
        })
        queryEditText.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable) {}
            override fun beforeTextChanged(s: CharSequence, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence, start: Int, before: Int, count: Int) {
                try {
                    Pattern.compile(query)
                } catch (e: PatternSyntaxException) {
                    return
                }

                updateHolidays()
            }
        })
    }

    private fun loadHolidays(): List<Holiday> {
        val result = ArrayList<Holiday>()
        val year = year
        try {
            val input = applicationContext.assets.open("holidays.txt")

            val `in` = BufferedReader(InputStreamReader(input))
            var line: String?

            while (true) {
                line = `in`.readLine()
                if (line == null) {
                    break
                }
                val tokens = line.split(":".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
                val data = tokens[1]
                val ints = tokens[0].split("-".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
                val day = ints[0].toInt()
                val month = ints[1].toInt()
                result.add(Holiday(year, month, day, data))
            }
        } catch (e: IOException) {
            Utils.toastIt(applicationContext, "Error loading holidays file")
        }

        return result
    }

    private fun updateHolidays() {
        try {
            Pattern.compile(query)
        } catch (e: PatternSyntaxException) {
            Utils.toastIt(applicationContext, "Invalid regex syntax")
            return
        }

        val year = year
        val sortByName = sortByName
        for (holiday in holidays) {
            holiday.updateYear(year)
        }
        val filteredHolidays = filterHolidays()
        Collections.sort(filteredHolidays,
                if (sortByName) Holiday.nameFirstComparator else Holiday.dateFirstComparator)
        val toShow = StringBuilder("\n")
        for (holiday in filteredHolidays) {
            toShow.append(holiday.toString(sortByName))
        }
        holidaysTextView.text = toShow
    }

    private fun filterHolidays(): List<Holiday> {
        val result = ArrayList<Holiday>()
        val day = day
        val month = month
        val dayOfWeek = dayOfWeek
        val query = query
        for (holiday in holidays) {
            if (holiday.satisfiesFilters(day, month, dayOfWeek, query)) {
                result.add(holiday)
            }
        }
        return result
    }
}
