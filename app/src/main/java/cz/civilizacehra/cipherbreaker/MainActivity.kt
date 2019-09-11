package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.TextView

class MainActivity : Activity() {

    private val presmyslovnik by lazy { findViewById<TextView>(R.id.Presmyslovnik) }
    private val debinarizator by lazy { findViewById<TextView>(R.id.Debinarizator) }
    private val deternarizator by lazy { findViewById<TextView>(R.id.Deternarizator) }
    private val mrizkodrtic by lazy { findViewById<TextView>(R.id.MrizkoDrtic) }
    private val azimuther by lazy { findViewById<TextView>(R.id.Azimuther) }
    private val calendar by lazy { findViewById<TextView>(R.id.Calendar) }
    private val principtrainer by lazy { findViewById<TextView>(R.id.PrincipTrainer) }
    private val principreader by lazy { findViewById<TextView>(R.id.PrincipReader) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        presmyslovnik.setOnClickListener {
            val myIntent = Intent(this@MainActivity, PresmyslovnikActivity::class.java)
            this@MainActivity.startActivity(myIntent)
        }

        debinarizator.setOnClickListener {
            val myIntent = Intent(this@MainActivity, DebinarizatorActivity::class.java)
            this@MainActivity.startActivity(myIntent)
        }

        deternarizator.setOnClickListener {
            val myIntent = Intent(this@MainActivity, DeternarizatorActivity::class.java)
            this@MainActivity.startActivity(myIntent)
        }

        mrizkodrtic.setOnClickListener {
            val myIntent = Intent(this@MainActivity, MrizkoDrticActivity::class.java)
            this@MainActivity.startActivity(myIntent)
        }

        azimuther.setOnClickListener {
            val myIntent = Intent(this@MainActivity, AzimutherActivity::class.java)
            this@MainActivity.startActivity(myIntent)
        }

        calendar.setOnClickListener {
            val myIntent = Intent(this@MainActivity, CalendarActivity::class.java)
            this@MainActivity.startActivity(myIntent)
        }

        principtrainer.setOnClickListener {
            val myIntent = Intent(this@MainActivity, PrincipTrainerActivity::class.java)
            this@MainActivity.startActivity(myIntent)
        }

        principreader.setOnClickListener {
            val myIntent = Intent(this@MainActivity, PrincipReaderActivity::class.java)
            this@MainActivity.startActivity(myIntent)
        }
    }
}
