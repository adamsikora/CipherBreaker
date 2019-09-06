package cz.civilizacehra.cipherbreaker;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

public class MrizkoDrticActivity extends Activity {

    Button goBtn;
    EditText inputBox;
    TextView results;

    boolean isTrieInitialized;

    static {
        System.loadLibrary("MrizkoDrtic");
    }

    private native String grindGrid(String str);
    private native void initializeTrie(Object mgr);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_mrizko_drtic);

        goBtn = findViewById(R.id.GoBtn);
        inputBox = findViewById(R.id.inputEditText);
        results = findViewById(R.id.resultTextView);

        try {
            InputStream inputStream = getApplicationContext().getAssets().open("cs_CZ_openoffice.canon");
            BufferedReader in = new BufferedReader(new InputStreamReader(inputStream));
            String line;

            while((line = in.readLine()) != null) {
                StringPair word = StringPair.fromString(line);
                //mTrieMap.put(word.getFirst(), "");
            }
        } catch (java.io.IOException e) {

        }

        if (goBtn != null) {
            goBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {

                    InputMethodManager inputManager = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                    inputManager.hideSoftInputFromWindow(getCurrentFocus().getWindowToken(), InputMethodManager.HIDE_NOT_ALWAYS);

                    results.setText("Result:\n");

                    String input = inputBox.getText().toString().replaceAll("[^A-Za-z0-9_]", "").toLowerCase();

                    try {
                        if (!isTrieInitialized) {
                            initializeTrie((Object)getApplicationContext().getAssets());
                            isTrieInitialized = true;
                        }
                        long start = System.currentTimeMillis();
                        String solutions = grindGrid(input);
                        results.setText("Result: " + String.format("%.3f", 0.001*(System.currentTimeMillis() - start)) + "s\n");
                        results.setText(results.getText().toString() + solutions);
                    } catch (Throwable e) {

                    }
                }
            });
        }
    }
}
