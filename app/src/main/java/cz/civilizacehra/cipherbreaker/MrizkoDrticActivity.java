package cz.civilizacehra.cipherbreaker;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import java.util.Locale;

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
                            initializeTrie(getApplicationContext().getAssets());
                            isTrieInitialized = true;
                        }
                        long start = System.currentTimeMillis();
                        String solutions = grindGrid(input);
                        results.setText("Result: " + String.format(Locale.ENGLISH, "%.3f", 0.001*(System.currentTimeMillis() - start)) + "s\n" + solutions);
                    } catch (Throwable e) {

                    }
                }
            });
        }
    }
}
