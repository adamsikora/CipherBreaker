package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.ImageView
import android.widget.RelativeLayout
import android.widget.TableLayout
import android.widget.TextView
import android.net.Uri


class MainActivity : Activity() {

    data class ActivityInstance(val name: String, val drawable: Int, val intent: Intent)

    private val tableLayout by lazy { findViewById<TableLayout>(R.id.tableLayout) }

    val activities by lazy {
        listOf(
            ActivityInstance(
                getString(R.string.presmyslovnik), R.drawable.ic_find_replace,
                Intent(this@MainActivity, PresmyslovnikActivity::class.java)),
            ActivityInstance(
                getString(R.string.debinarizator), R.drawable.ic_two,
                Intent(this@MainActivity, DebinarizatorActivity::class.java)),
            ActivityInstance(
                getString(R.string.deternarizator), R.drawable.ic_three,
                Intent(this@MainActivity, DeternarizatorActivity::class.java)),
            ActivityInstance(
                getString(R.string.griller), R.drawable.ic_grid_on,
                Intent(this@MainActivity, GrillerActivity::class.java)),
            // ActivityInstance(
            //         getString(R.string.mrizkodrtic), R.drawable.ic_grid_on,
            //         Intent(this@MainActivity, MrizkoDrticActivity::class.java)),
            ActivityInstance(
                getString(R.string.azimuther), R.drawable.ic_explore,
                Intent(this@MainActivity, AzimutherActivity::class.java)),
            ActivityInstance(
                getString(R.string.calendar), R.drawable.ic_date_range,
                Intent(this@MainActivity, CalendarActivity::class.java)),
            ActivityInstance(
                getString(R.string.primes), R.drawable.ic_prime,
                Intent(this@MainActivity, PrimeActivity::class.java)),
            ActivityInstance(
                getString(R.string.playfair), R.drawable.ic_playfair,
                Intent(this@MainActivity, PlayfairActivity::class.java)),
            ActivityInstance(
                getString(R.string.principtrainer), R.drawable.ic_school,
                Intent(Intent.ACTION_VIEW, Uri.parse("https://app.civilizacehra.cz"))),
            ActivityInstance(
                getString(R.string.about), R.drawable.ic_info,
                Intent(this@MainActivity, AboutActivity::class.java))
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        for (activity in activities) {
            val layout = layoutInflater.inflate(R.layout.activity_item, tableLayout, false) as RelativeLayout
            tableLayout.addView(layout)

            layout.findViewById<ImageView>(R.id.activityIcon).setImageResource(activity.drawable)
            layout.findViewById<TextView>(R.id.activityText).text = activity.name

            layout.setOnClickListener {
                this@MainActivity.startActivity(activity.intent)
            }
        }
    }
}
