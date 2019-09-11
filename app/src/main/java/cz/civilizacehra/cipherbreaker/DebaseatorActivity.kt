package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.view.LayoutInflater
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.RadioGroup
import android.widget.RelativeLayout
import android.widget.ScrollView

import java.util.ArrayList
import kotlin.math.pow

abstract class DebaseatorActivity : Activity() {

    private val rowsLayout by lazy { findViewById<LinearLayout>(R.id.rowsLayout) }
    internal var rows = ArrayList<View>()
    internal val alphabetStart by lazy { findViewById<RadioGroup>(R.id.startRadioGroup) }

    internal var mBase = 0
    internal var mBaseLength = 0
    internal var mBaseMax = 0
    private var mRowLayout = 0

    internal var bits: IntArray? = null
    internal var results: IntArray? = null

    internal val alphabet = arrayOf(" ", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z")
    private val chAlphabet = arrayOf(" ", "A", "B", "C", "D", "E", "F", "G", "H", "CH", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z")

    protected fun commonInit(base: Int, baseLength: Int, rowLayout: Int) {
        mBase = base
        mBaseLength = baseLength
        mBaseMax = base.toDouble().pow(baseLength).toInt() - 1

        mRowLayout = rowLayout

        alphabetStart.setOnCheckedChangeListener { _, _ -> updateRows() }

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

    protected fun getLetter(i: Int): String {
        return if (i in 1..26) alphabet[i] else " "
    }

    protected fun getChLetter(i: Int): String {
        return if (i in 1..27) chAlphabet[i] else " "
    }

    fun updateRows() {
        for (row in rows) {
            row.callOnClick()
        }
    }

    private fun addRow() {
        val layout = layoutInflater.inflate(mRowLayout, null, false) as RelativeLayout
        rows.add(layout)
        rowsLayout!!.addView(layout)

        for (j in 0 until mBaseLength) {
            val view = layout.findViewById<ImageView>(bits!![j])
            view.tag = 0
            view.setImageResource(resources.getIdentifier("@android:drawable/alert_light_frame", null, null))
        }

        layout.setOnClickListener { onRowClick(layout) }

        for (j in 0 until mBaseLength) {
            val view = layout.findViewById<ImageView>(bits!![j])
            view.setOnClickListener(object : View.OnClickListener {
                private var counter = view.tag as Int

                override fun onClick(v: View) {
                    ++counter
                    counter %= mBase
                    view.tag = counter
                    val imageType = when (counter) {
                        0 -> "@android:drawable/alert_light_frame"
                        mBase - 1 -> "@android:drawable/alert_dark_frame"
                        else -> "@android:drawable/btn_check_off_holo"
                    }
                    view.setImageResource(resources.getIdentifier(imageType, null, null))

                    layout.callOnClick()
                }
            })
        }
    }

    protected open fun onRowClick(layout: RelativeLayout) {}
}
