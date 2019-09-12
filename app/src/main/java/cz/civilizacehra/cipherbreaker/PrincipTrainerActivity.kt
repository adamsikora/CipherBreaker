package cz.civilizacehra.cipherbreaker

import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Log
import android.widget.ImageView
import android.widget.Switch

import java.io.IOException
import java.io.InputStream
import java.util.ArrayList

class PrincipTrainerActivity : BasePrincipActivity() {

    private val imageView by lazy { findViewById<ImageView>(R.id.imageView) }
    private val solutions by lazy { arrayOf<ImageView>(
            findViewById(R.id.solution1),
            findViewById(R.id.solution2),
            findViewById(R.id.solution3),
            findViewById(R.id.solution4),
            findViewById(R.id.solution5)
    ) }

    private var mInvert: Boolean = false
    private var mCurrent = 0
    private var mLast = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        setContentView(R.layout.activity_princip_trainer)
        super.onCreate(savedInstanceState)

        findViewById<Switch>(R.id.invertSwitch).setOnCheckedChangeListener { _, isChecked ->
            mInvert = isChecked
            solutionView.text = ""
            newExample()
        }

        for (i in 0..4) {
            solutions[i].setOnClickListener {
                if (i == mCurrent) {
                    Thread(Runnable {
                        runOnUiThread {
                            setSolution(i, "Correct !", mHihglightColor)
                        }
                        try {
                            Thread.sleep(300)
                        } catch (e: InterruptedException) {
                            e.printStackTrace()
                        }

                        runOnUiThread {
                            solutionView.text = ""
                            newExample()
                        }
                    }).start()
                } else {
                    setSolution(i, "Wrong !!!", mWrongColor)
                }
            }
        }

        solutionButton.setOnClickListener {
            solutions[mCurrent].setBackgroundColor(mHihglightColor)
        }

        newExample()
    }

    private fun setSolution(index: Int, text: String, color: Int) {
        solutions[index].setBackgroundColor(color)
        solutionView.setTextColor(color)
        solutionView.text = text
    }

    override fun newExample() {
        for (i in 0..4) {
            solutions[i].setBackgroundColor(mDefaultColor)
        }

        mCurrent = mRandom.nextInt(5)

        val mSource = if (mInvert) mPrincip else "a"
        val mOut = if (mInvert) "a" else mPrincip

        val list = ArrayList<Int>()
        for (i in 1..26) {
            if (i != mLast) {
                list.add(i)
            }
        }
        list.shuffle()
        for (i in 0..4) {
            setImage(solutions[i], "principy/$mSource/${list[i]}.png")
        }
        mLast = list[mCurrent]

        var `is`: InputStream? = null
        try {
            `is` = this.resources.assets.open("principy/$mOut/${list[mCurrent]}.png")
        } catch (e: IOException) {
            Log.w("EL", e)
        }

        val image = BitmapFactory.decodeStream(`is`)
        imageView.setImageBitmap(image)
        imageView.setBackgroundColor(mDefaultColor)
    }
}
