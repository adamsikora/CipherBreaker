package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.GridLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

import java.io.BufferedReader
import java.io.IOException
import java.io.InputStream
import java.io.InputStreamReader
import java.util.Random
import java.util.Vector

class PrincipReaderActivity : Activity() {

    private var principy = arrayOfNulls<ImageView>(6)

    private var solutionView: TextView? = null
    private var nextButton: Button? = null
    private var solutionButton: Button? = null
    private var wordGridLayout: GridLayout? = null

    private var mHihglightColor = -0xdb78d1
    private var mDefaultColor = -0x444445

    private var mPrincipy = arrayOf("n", "m", "b", "s", "bin", "t")
    private var mPrincip = "n"
    private var mWords = Vector<String>()
    private var mCurrentWord = ""
    private var mRandom = Random()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_princip_reader)

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
                newWord()
            })
        }

        solutionView = findViewById(R.id.solutionView)

        nextButton = findViewById(R.id.nextButton)
        nextButton!!.setOnClickListener { newWord() }

        solutionButton = findViewById(R.id.solutionButton)
        solutionButton!!.setOnClickListener { solutionView!!.text = mCurrentWord }

        wordGridLayout = findViewById(R.id.wordGridLayout)

        setImage(principy[0]!!, "principy/n/7.png")
        setImage(principy[1]!!, "principy/m/16.png")
        setImage(principy[2]!!, "principy/b/9.png")
        setImage(principy[3]!!, "principy/s/13.png")
        setImage(principy[4]!!, "principy/bin/21.png")
        setImage(principy[5]!!, "principy/t/15.png")

        try {
            val inputStream = applicationContext.assets.open("cs_CZ_openoffice.canon")
            val `in` = BufferedReader(InputStreamReader(inputStream))

            var line: String?
            while (true) {
                line = `in`.readLine()
                if (line == null) {
                    break
                }
                val word = StringPair.fromString(line)
                val first = word.first

                mWords.add(first)
            }
        } catch (e: IOException) {
            Utils.toastIt(applicationContext, "Error loading dictionary file")
        }

        newWord()
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
    }

    private fun newWord() {
        solutionView!!.text = ""
        mCurrentWord = mWords.elementAt(mRandom.nextInt(mWords.size))
        wordGridLayout!!.removeAllViews()
        for (i in 0 until mCurrentWord.length) {
            val index = mCurrentWord[i] - 'a' + 1
            val newView = ImageView(this)
            val dim = 240
            val layoutParams = LinearLayout.LayoutParams(dim, dim)
            newView.layoutParams = layoutParams
            newView.setPadding(30, 0, 0, 0)
            setImage(newView, "principy/$mPrincip/$index.png")
            wordGridLayout!!.addView(newView)
        }
    }
}
