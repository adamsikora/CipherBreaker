package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.CompoundButton
import android.widget.ImageView
import android.widget.Switch
import android.widget.TextView

import java.io.IOException
import java.io.InputStream
import java.util.ArrayList
import java.util.Collections
import java.util.Random

class PrincipTrainerActivity : Activity() {

    private var principy = arrayOfNulls<ImageView>(6)
    private var invertSwitch: Switch? = null

    private var imageView: ImageView? = null
    private var solutions = arrayOfNulls<ImageView>(5)

    private var textView: TextView? = null
    private var nextButton: Button? = null
    private var solutionButton: Button? = null

    private var mHihglightColor = -0xdb78d1
    private var mWrongColor = -0x40cbcc
    private var mDefaultColor = -0x444445

    private var mInvert: Boolean = false
    private var mPrincipy = arrayOf("n", "m", "b", "s", "bin", "t")
    private var mPrincip = "n"
    private var mRandom = Random()
    private var mCurrent = 0
    private var mLast = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_princip_trainer)

        principy[0] = findViewById<ImageView>(R.id.nImage)
        principy[1] = findViewById<ImageView>(R.id.mImage)
        principy[2] = findViewById<ImageView>(R.id.bImage)
        principy[3] = findViewById<ImageView>(R.id.sImage)
        principy[4] = findViewById<ImageView>(R.id.binImage)
        principy[5] = findViewById<ImageView>(R.id.tImage)

        for (i in mPrincipy.indices) {
            val ii = i
            if (i == 0) {
                principy[i]!!.setBackgroundColor(mHihglightColor)
            } else {
                principy[i]!!.setBackgroundColor(mDefaultColor)
            }
            principy[i]!!.setOnClickListener(View.OnClickListener {
                mPrincip = mPrincipy[ii]
                for (i in mPrincipy.indices) {
                    if (i == ii) {
                        principy[i]!!.setBackgroundColor(mHihglightColor)
                    } else {
                        principy[i]!!.setBackgroundColor(mDefaultColor)
                    }
                }
                newLetter()
            })
        }

        invertSwitch = findViewById(R.id.invertSwitch)
        invertSwitch!!.setOnCheckedChangeListener { buttonView, isChecked ->
            mInvert = isChecked
            newLetter()
        }

        imageView = findViewById(R.id.imageView)

        solutions[0] = findViewById<ImageView>(R.id.solution1)
        solutions[1] = findViewById<ImageView>(R.id.solution2)
        solutions[2] = findViewById<ImageView>(R.id.solution3)
        solutions[3] = findViewById<ImageView>(R.id.solution4)
        solutions[4] = findViewById<ImageView>(R.id.solution5)

        for (i in 0..4) {
            solutions[i]!!.setOnClickListener(View.OnClickListener {
                if (i == mCurrent) {
                    Thread(Runnable {
                        runOnUiThread {
                            solutions[i]!!.setBackgroundColor(mHihglightColor)
                            textView!!.setTextColor(mHihglightColor)
                            textView!!.text = "Correct !"
                        }
                        try {
                            Thread.sleep(300)
                        } catch (e: InterruptedException) {
                            e.printStackTrace()
                        }

                        runOnUiThread { newLetter() }
                    }).start()
                } else {
                    solutions[i]!!.setBackgroundColor(mWrongColor)
                    textView!!.setTextColor(mWrongColor)
                    textView!!.text = "Wrong !!!"
                }
            })
        }

        textView = findViewById(R.id.textView)

        nextButton = findViewById(R.id.nextButton)
        nextButton!!.setOnClickListener { newLetter() }

        solutionButton = findViewById(R.id.solutionButton)
        solutionButton!!.setOnClickListener {
            solutions[mCurrent]!!.setBackgroundColor(mHihglightColor)
            /*textView.setTextColor(mHihglightColor);
                textView.setText("Correct !");*/
        }

        setImage(principy[0]!!, "principy/n/7.png")
        setImage(principy[1]!!, "principy/m/16.png")
        setImage(principy[2]!!, "principy/b/9.png")
        setImage(principy[3]!!, "principy/s/13.png")
        setImage(principy[4]!!, "principy/bin/21.png")
        setImage(principy[5]!!, "principy/t/15.png")

        newLetter()
    }

    private fun setImage(btn: ImageView, path: String) {
        var `is`: InputStream? = null
        try {
            `is` = this.resources.assets.open(path)
        } catch (e: IOException) {
            Log.w("EL", e)
        }

        val image = BitmapFactory.decodeStream(`is`)
        btn.setImageBitmap(image)
        imageView!!.setBackgroundColor(mDefaultColor)
    }

    private fun newLetter() {
        for (i in 0..4) {
            solutions[i]!!.setBackgroundColor(mDefaultColor)
            textView!!.text = ""
        }

        val mSource: String
        val mOut: String
        mCurrent = mRandom.nextInt(5)

        if (mInvert) {
            mSource = mPrincip
            mOut = "a"
        } else {
            mSource = "a"
            mOut = mPrincip
        }

        val list = ArrayList<Int>()
        for (i in 1..26) {
            if (i != mLast) {
                list.add(i)
            }
        }
        list.shuffle()
        for (i in 0..4) {
            setImage(solutions[i]!!, "principy/" + mSource + "/" + list[i] + ".png")
        }
        mLast = list[mCurrent]

        var `is`: InputStream? = null
        try {
            `is` = this.resources.assets.open("principy/" + mOut + "/" + list[mCurrent] + ".png")
        } catch (e: IOException) {
            Log.w("EL", e)
        }

        val image = BitmapFactory.decodeStream(`is`)
        imageView!!.setImageBitmap(image)
        imageView!!.setBackgroundColor(mDefaultColor)
    }
}
