package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.os.Bundle
import android.text.method.LinkMovementMethod
import android.view.View
import android.widget.TextView


class AboutActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_about)
        val githubLink = findViewById<View>(R.id.githubView) as TextView
        githubLink.movementMethod = LinkMovementMethod.getInstance()
    }
}