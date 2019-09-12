package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.graphics.BitmapFactory
import android.os.Bundle
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView

import java.io.IOException
import java.util.Random

abstract class BasePrincipActivity : Activity() {

    private val principy by lazy { arrayOf<ImageView>(
            findViewById(R.id.nImage),
            findViewById(R.id.mImage),
            findViewById(R.id.bImage),
            findViewById(R.id.sImage),
            findViewById(R.id.binImage),
            findViewById(R.id.tImage)
    ) }

    internal val solutionView by lazy { findViewById<TextView>(R.id.solutionView) }
    internal val solutionButton by lazy { findViewById<Button>(R.id.solutionButton) }
    internal val nextButton by lazy { findViewById<Button>(R.id.nextButton) }

    internal val mHihglightColor = -0xdb78d1
    internal val mWrongColor = -0x40cbcc
    internal val mDefaultColor = -0x444445

    internal val mRandom = Random()
    internal val mPrincipy = arrayOf("n", "m", "b", "s", "bin", "t")
    internal var mPrincip = "n"
    internal var mCurrentExample = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val setHighlightedPrincip = fun(highlight: Int) {
            mPrincip = mPrincipy[highlight]
            for (i in mPrincipy.indices) {
                principy[i].setBackgroundColor(if (i == highlight) mHihglightColor else mDefaultColor)
            }
        }
        setHighlightedPrincip(0)
        for (i in mPrincipy.indices) {
            principy[i].setOnClickListener {
                setHighlightedPrincip(i)
                newExample()
            }
        }

        setImage(principy[0], "principy/n/7.png")
        setImage(principy[1], "principy/m/16.png")
        setImage(principy[2], "principy/b/9.png")
        setImage(principy[3], "principy/s/13.png")
        setImage(principy[4], "principy/bin/21.png")
        setImage(principy[5], "principy/t/15.png")

        nextButton.setOnClickListener {
            solutionView.text = ""
            newExample()
        }
    }

    internal fun setImage(btn: ImageView, path: String) {
        try {
            val `is` = this.resources.assets.open(path)
            val image = BitmapFactory.decodeStream(`is`)
            btn.setImageBitmap(image)
        } catch (e: IOException) {
            Utils.toastIt(applicationContext, "Error loading image file")
        }

    }

    internal abstract fun newExample()
}
