package cz.civilizacehra.cipherbreaker;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

public class MainActivity extends Activity {

    TextView presmyslovnik, debinarizator, deternarizator, mrizkodrtic, principtrainer, principreader;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        presmyslovnik = (TextView)findViewById(R.id.Presmyslovnik);
        debinarizator = (TextView)findViewById(R.id.Debinarizator);
        deternarizator = (TextView)findViewById(R.id.Deternarizator);
        mrizkodrtic = (TextView)findViewById(R.id.MrizkoDrtic);
        principtrainer = (TextView)findViewById(R.id.PrincipTrainer);
        principreader = (TextView)findViewById(R.id.PrincipReader);

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
