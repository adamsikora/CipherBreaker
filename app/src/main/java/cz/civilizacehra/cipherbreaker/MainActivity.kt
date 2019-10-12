package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.ImageView
import android.widget.RelativeLayout
import android.widget.TableLayout
import android.widget.TextView

class MainActivity : Activity() {

    data class ActivityInstance(val name: String, val drawable: Int, val activity: Class<*>)

    private val tableLayout by lazy { findViewById<TableLayout>(R.id.tableLayout) }

    val activities by lazy {
        listOf(
                ActivityInstance(getString(R.string.presmyslovnik), R.drawable.ic_find_replace, PresmyslovnikActivity::class.java),
                ActivityInstance(getString(R.string.debinarizator), R.drawable.ic_two, DebinarizatorActivity::class.java),
                ActivityInstance(getString(R.string.deternarizator), R.drawable.ic_three, DeternarizatorActivity::class.java),
                ActivityInstance(getString(R.string.mrizkodrtic), R.drawable.ic_grid_on, MrizkoDrticActivity::class.java),
                ActivityInstance(getString(R.string.azimuther), R.drawable.ic_explore, AzimutherActivity::class.java),
                ActivityInstance(getString(R.string.calendar), R.drawable.ic_calendar, CalendarActivity::class.java),
                ActivityInstance(getString(R.string.principtrainer), R.drawable.ic_school, PrincipTrainerActivity::class.java),
                ActivityInstance(getString(R.string.principreader), R.drawable.ic_assignment, PrincipReaderActivity::class.java),
                ActivityInstance(getString(R.string.about), R.drawable.ic_info, AboutActivity::class.java)
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
                val myIntent = Intent(this@MainActivity, activity.activity)
                this@MainActivity.startActivity(myIntent)
            }
        }
    }
}
