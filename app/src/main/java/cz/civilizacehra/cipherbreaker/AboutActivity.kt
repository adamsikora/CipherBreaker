package cz.civilizacehra.cipherbreaker

import android.app.Activity
import android.os.Bundle
import android.view.Gravity

import mehdi.sakout.aboutpage.AboutPage
import mehdi.sakout.aboutpage.Element

class AboutActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_about)

        val copyRightsElement = Element()
        copyRightsElement.title = "© Adam Sikora 2019"
        copyRightsElement.gravity = Gravity.CENTER

        val aboutPage = AboutPage(this)
                .isRTL(false)
                .setDescription("This app was created to help with Puzzle Hunt competitions. " +
                                "Note that it contains some powerful tools and usage of some " +
                                "might be against the rules of some particular Puzzle Hunts. " +
                                "Suggestions or contributions on github are welcome. ")
                .addItem(Element().setTitle("Version 1.3"))
                .addEmail("adam.sikora73@gmail.com")
                .addGitHub("adamsikora/CipherBreaker")
                .addItem(copyRightsElement)
                .create()

        setContentView(aboutPage)
    }
}