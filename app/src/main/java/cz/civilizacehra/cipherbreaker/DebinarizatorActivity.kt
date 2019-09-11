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

        var down = 0
        var up = 0
        for (k in 0 until mBaseLength) {
            down *= mBase
            down += values[k]
        }
        for (k in mBaseLength - 1 downTo 0) {
            up *= mBase
            up += values[k]
        }
        val offset = if (alphabetStart.checkedRadioButtonId == R.id.rbtn0) 1 else 0

        if (up in 0..mBaseMax) {
            layout.findViewById<TextView>(results!![0]).text = getLetter(up + offset)
            layout.findViewById<TextView>(results!![1]).text = getLetter(mBaseMax - up + offset)
        }
        if (down in 0..mBaseMax) {
            layout.findViewById<TextView>(results!![2]).text = getLetter(down + offset)
            layout.findViewById<TextView>(results!![3]).text = getLetter(mBaseMax - down + offset)
        }
    }
}
