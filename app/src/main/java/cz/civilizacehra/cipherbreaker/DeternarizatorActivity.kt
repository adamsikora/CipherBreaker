package cz.civilizacehra.cipherbreaker

import android.os.Bundle
import android.view.View
import android.widget.*

class DeternarizatorActivity : DebaseatorActivity() {
    internal val mode by lazy { findViewById<RadioGroup>(R.id.modeRadioGroup) }
    internal val direction by lazy { findViewById<RadioGroup>(R.id.directionRadioGroup) }
    internal val directionRight by lazy { findViewById<RadioButton>(R.id.rbtnRight) }
    internal val directionLeft by lazy { findViewById<RadioButton>(R.id.rbtnLeft) }
    internal val ch by lazy { findViewById<Switch>(R.id.chSwitch) }

    private val settingsLayout by lazy { findViewById<RelativeLayout>(R.id.settingsLayout) }
    private val closeIcon by lazy { findViewById<RelativeLayout>(R.id.closeIconLayout) }
    private val settingsIcon by lazy { findViewById<RelativeLayout>(R.id.settingsIconLayout) }

    internal val images by lazy { arrayOf<ImageView>(
            findViewById(R.id.interpretation1),
            findViewById(R.id.interpretation2),
            findViewById(R.id.interpretation3),
            findViewById(R.id.interpretation4),
            findViewById(R.id.interpretation5),
            findViewById(R.id.interpretation6)
    ) }
    internal val mapping = arrayOf(
            intArrayOf(0, 1, 2),
            intArrayOf(0, 2, 1),
            intArrayOf(1, 0, 2),
            intArrayOf(1, 2, 0),
            intArrayOf(2, 0, 1),
            intArrayOf(2, 1, 0)
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_deternarizator)
        bits = intArrayOf(
                R.id.tern1,
                R.id.tern2,
                R.id.tern3
        )
        results = intArrayOf(
                R.id.result1,
                R.id.result2,
                R.id.result3,
                R.id.result4,
                R.id.result5,
                R.id.result6
        )
        commonInit(3, 3, R.layout.ternaryrow)

        direction.setOnCheckedChangeListener { _, _ -> updateRows() }
        mode.setOnCheckedChangeListener { _, checkedId ->
            when (checkedId) {
                R.id.rbtnOrder -> {
                    directionRight.isEnabled = false
                    directionLeft.isEnabled = false
                    images[0].setImageResource(R.drawable.ternaryorder6)
                    images[1].setImageResource(R.drawable.ternaryorder5)
                    images[2].setImageResource(R.drawable.ternaryorder4)
                    images[3].setImageResource(R.drawable.ternaryorder3)
                    images[4].setImageResource(R.drawable.ternaryorder2)
                    images[5].setImageResource(R.drawable.ternaryorder1)
                }
                R.id.rbtnValues -> {
                    directionRight.isEnabled = true
                    directionLeft.isEnabled = true
                    images[0].setImageResource(R.drawable.ternary1)
                    images[1].setImageResource(R.drawable.ternary2)
                    images[2].setImageResource(R.drawable.ternary3)
                    images[3].setImageResource(R.drawable.ternary4)
                    images[4].setImageResource(R.drawable.ternary5)
                    images[5].setImageResource(R.drawable.ternary6)
                }
            }
            updateRows()
        }
        ch.setOnCheckedChangeListener { _, _ -> updateRows() }

        closeIcon.setOnClickListener { settingsLayout.visibility = View.GONE }
        settingsIcon.setOnClickListener {
            if (settingsLayout.visibility == View.GONE) {
                settingsLayout.visibility = View.VISIBLE
            } else {
                settingsLayout.visibility = View.GONE
            }
        }
    }

    override fun onRowClick(layout: RelativeLayout) {
        val values = IntArray(mBaseLength)
        for (k in 0 until mBaseLength) {
            val value = layout.findViewById<ImageView>(bits!![k]).tag as Int
            values[k] = value
        }
        val iterate = if (direction.checkedRadioButtonId == R.id.rbtnRight) intArrayOf(2, 1, 0) else intArrayOf(0, 1, 2)

        val offset = if (alphabetStart!!.checkedRadioButtonId == R.id.rbtn0) 1 else 0

        for (i in 0..5) {
            var value = 0
            if (mode.checkedRadioButtonId == R.id.rbtnOrder) {
                for (j in mapping[5 - i]) {
                    value *= mBase
                    value += values[j]
                }
            } else {
                for (j in iterate) {
                    value *= mBase
                    value += mapping[i][values[j]]
                }
            }
            if (value in 0..mBaseMax) {
                val text = layout.findViewById<TextView>(results!![i])
                val letter = if (ch.isChecked) getChLetter(value + offset) else getLetter(value + offset)
                text.text = letter
            }
        }
    }
}