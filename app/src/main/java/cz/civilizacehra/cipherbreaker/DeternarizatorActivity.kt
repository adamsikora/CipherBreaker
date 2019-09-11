package cz.civilizacehra.cipherbreaker

import android.os.Bundle
import android.widget.CheckBox
import android.widget.ImageView
import android.widget.RelativeLayout
import android.widget.Switch
import android.widget.TextView

class DeternarizatorActivity : DebaseatorActivity() {
    internal val mode by lazy { findViewById<Switch>(R.id.modeSwitch) }
    internal val direction by lazy { findViewById<Switch>(R.id.directionSwitch) }
    internal val ch by lazy { findViewById<CheckBox>(R.id.chCheckBox) }
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
        mode.setOnCheckedChangeListener { _, isChecked ->
            direction.isEnabled = !isChecked
            if (isChecked) {
                images[0].setImageResource(R.drawable.ternaryorder6)
                images[1].setImageResource(R.drawable.ternaryorder5)
                images[2].setImageResource(R.drawable.ternaryorder4)
                images[3].setImageResource(R.drawable.ternaryorder3)
                images[4].setImageResource(R.drawable.ternaryorder2)
                images[5].setImageResource(R.drawable.ternaryorder1)
            } else {
                images[0].setImageResource(R.drawable.ternary1)
                images[1].setImageResource(R.drawable.ternary2)
                images[2].setImageResource(R.drawable.ternary3)
                images[3].setImageResource(R.drawable.ternary4)
                images[4].setImageResource(R.drawable.ternary5)
                images[5].setImageResource(R.drawable.ternary6)
            }
            updateRows()
        }
        ch.setOnCheckedChangeListener { _, _ -> updateRows() }
    }

    override fun onRowClick(layout: RelativeLayout) {
        val values = IntArray(mBaseLength)
        for (k in 0 until mBaseLength) {
            val value = layout.findViewById<ImageView>(bits!![k]).tag as Int
            values[k] = value
        }
        val iterate = if (direction.isChecked) intArrayOf(2, 1, 0) else intArrayOf(0, 1, 2)

        val offset = if (alphabetStart!!.checkedRadioButtonId == R.id.rbtn0) 1 else 0

        for (i in 0..5) {
            var value = 0
            if (mode.isChecked) {
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