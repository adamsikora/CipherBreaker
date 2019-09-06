package cz.civilizacehra.cipherbreaker;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

public class MainActivity extends Activity {

    TextView presmyslovnik, debinarizator, deternarizator, mrizkodrtic, azimuther, calendar, principtrainer, principreader;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        presmyslovnik = findViewById(R.id.Presmyslovnik);
        debinarizator = findViewById(R.id.Debinarizator);
        deternarizator = findViewById(R.id.Deternarizator);
        mrizkodrtic = findViewById(R.id.MrizkoDrtic);
        azimuther = findViewById(R.id.Azimuther);
        calendar = findViewById(R.id.Calendar);
        principtrainer = findViewById(R.id.PrincipTrainer);
        principreader = findViewById(R.id.PrincipReader);

        presmyslovnik.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent myIntent = new Intent(MainActivity.this, PresmyslovnikActivity.class);
                MainActivity.this.startActivity(myIntent);
            }
        });

        debinarizator.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent myIntent = new Intent(MainActivity.this, DebinarizatorActivity.class);
                MainActivity.this.startActivity(myIntent);
            }
        });

        deternarizator.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent myIntent = new Intent(MainActivity.this, DeternarizatorActivity.class);
                MainActivity.this.startActivity(myIntent);
            }
        });

        mrizkodrtic.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent myIntent = new Intent(MainActivity.this, MrizkoDrticActivity.class);
                MainActivity.this.startActivity(myIntent);
            }
        });

        azimuther.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent myIntent = new Intent(MainActivity.this, AzimutherActivity.class);
                MainActivity.this.startActivity(myIntent);
            }
        });

        calendar.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent myIntent = new Intent(MainActivity.this, CalendarActivity.class);
                MainActivity.this.startActivity(myIntent);
            }
        });

        principtrainer.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent myIntent = new Intent(MainActivity.this, PrincipTrainerActivity.class);
                MainActivity.this.startActivity(myIntent);
            }
        });

        principreader.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent myIntent = new Intent(MainActivity.this, PrincipReaderActivity.class);
                MainActivity.this.startActivity(myIntent);
            }
        });
    }
}
