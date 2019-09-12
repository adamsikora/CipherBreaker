package cz.civilizacehra.cipherbreaker

import android.os.Bundle
import android.widget.*

import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.util.*

class PrincipReaderActivity : BasePrincipActivity() {

    private val wordGridLayout by lazy { findViewById<GridLayout>(R.id.wordGridLayout) }

    private var mWords = Vector<String>()

    override fun onCreate(savedInstanceState: Bundle?) {
        setContentView(R.layout.activity_princip_reader)
        super.onCreate(savedInstanceState)

        solutionButton.setOnClickListener { solutionView.text = mCurrentExample }

        loadWords()
        newExample()
    }

    private fun loadWords() {
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
    }

    override fun newExample() {
        mCurrentExample = mWords.elementAt(mRandom.nextInt(mWords.size))
        wordGridLayout.removeAllViews()
        for (i in 0 until mCurrentExample.length) {
            val index = mCurrentExample[i] - 'a' + 1
            val newView = ImageView(this)
            val dim = 240
            val layoutParams = LinearLayout.LayoutParams(dim, dim)
            newView.layoutParams = layoutParams
            newView.setPadding(30, 0, 0, 0)
            setImage(newView, "principy/$mPrincip/$index.png")
            wordGridLayout.addView(newView)
        }
    }
}
