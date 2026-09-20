package cz.civilizacehra.cipherbreaker

import android.os.Bundle
import android.widget.ImageView
import android.widget.RelativeLayout
import android.widget.TextView

class DebinarizatorActivity : DebaseatorActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_debinarizator)
        bits = intArrayOf(
                R.id.bit1,
                R.id.bit2,
                R.id.bit3,
                R.id.bit4,
                R.id.bit5
        )
        results = intArrayOf(
                R.id.result11,
                R.id.result12,
                R.id.result21,
                R.id.result22
        )
        commonInit(2, 5, R.layout.binaryrow)
    }

    override fun onRowClick(layout: RelativeLayout) {
        val values = IntArray(mBaseLength)
        for (k in 0 until mBaseLength) {
            val view = layout.findViewById<ImageView>(bits!![k])
            val value = view.tag as Int
            values[k] = value
        }

        val offset = if (alphabetStart.checkedRadioButtonId == R.id.rbtn0) 1 else 0

        val letters = BaseReader.binaryLetters(values, offset)
        for (i in letters.indices) {
            layout.findViewById<TextView>(results!![i]).text = letters[i]
        }
    }
}
