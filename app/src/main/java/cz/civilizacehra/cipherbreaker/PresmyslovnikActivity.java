package cz.civilizacehra.cipherbreaker;

import android.content.Context;
import android.content.SharedPreferences;
import android.location.LocationManager;
import android.preference.PreferenceManager;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.RadioGroup;
import android.widget.TextView;

import java.util.Objects;
import java.util.regex.PatternSyntaxException;

public class PresmyslovnikActivity extends LocationActivity {

    SharedPreferences sharedPreferences;

    Button goBtn;
    EditText inputBox;
    EditText minLengthBox;
    EditText maxLengthBox;
    TextView results;
    RadioGroup mode, source;
    CheckBox svjz;

    Dictionary enDict, czPJDict, czDict, czBigDict;
    MapDictionary pragueMap, brnoMap;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_presmyslovnik);

        goBtn = findViewById(R.id.GoBtn);
        inputBox = findViewById(R.id.inputEditText);
        minLengthBox = findViewById(R.id.minEditText);
        maxLengthBox = findViewById(R.id.maxEditText);
        results = findViewById(R.id.resultTextView);
        mode = findViewById(R.id.modeRadioGrp);
        source = findViewById(R.id.sourceRadioGrp);
        svjz = findViewById(R.id.svjzCheckBox);

        source.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            public void onCheckedChanged(RadioGroup arg0, int id) {
                switch (id) {
                    case R.id.mapBrnoRadioBtn:
                    case R.id.mapPragueRadioBtn:
                        if (mLocation == null) {
                            acquireLocation();
                        }
                        break;
                    default:
                        break;
                }
                refreshSvjz(id, mode.getCheckedRadioButtonId());
            }
        });

        mode.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            public void onCheckedChanged(RadioGroup arg0, int id) {
                refreshSvjz(source.getCheckedRadioButtonId(), id);
            }
        });

        loadRadioButtons();
        refreshSvjz(source.getCheckedRadioButtonId(), mode.getCheckedRadioButtonId());

        enDict = new Dictionary(getApplicationContext(), "en.canon", results);
        czPJDict = new Dictionary(getApplicationContext(), "podst_jm_cz.canon", results);
        czDict = new Dictionary(getApplicationContext(), "cs_CZ_openoffice.canon", results);
        czBigDict = new Dictionary(getApplicationContext(), "cs.canon", results);
        brnoMap = new MapDictionary(getApplicationContext(), "map_brno.sifrohal", results);
        pragueMap = new MapDictionary(getApplicationContext(), "map_prague.sifrohal", results);

        mLocationManager = (LocationManager) this.getSystemService(Context.LOCATION_SERVICE);

        inputBox.setOnKeyListener(new View.OnKeyListener() {
            public boolean onKey(View v, int keyCode, KeyEvent event) {
                // If the event is a key-down event on the "enter" button
                if (event.getAction() == KeyEvent.ACTION_DOWN && keyCode == KeyEvent.KEYCODE_ENTER) {
                    searchDictionary();
                    return true;
                }
                return false;
            }
        });

        inputBox.requestFocus();

        if (goBtn != null) {
            goBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    searchDictionary();
                }
            });
        }
    }

    void saveRadioButtons(){
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putInt("modeRadioButton", mode.getCheckedRadioButtonId());
        editor.putInt("sourceRadioButton", source.getCheckedRadioButtonId());
        editor.apply();
    }

    void loadRadioButtons(){
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        mode.check(sharedPreferences.getInt("modeRadioButton", mode.getCheckedRadioButtonId()));
        source.check(sharedPreferences.getInt("sourceRadioButton", source.getCheckedRadioButtonId()));
    }

    void refreshSvjz(int sourceId, int modeId) {
        svjz.setEnabled((sourceId == R.id.mapBrnoRadioBtn || sourceId == R.id.mapPragueRadioBtn) &&
                (modeId == R.id.exactRadioBtn || modeId == R.id.supersetRadioBtn)
        );
    }

    void searchDictionary() {
        InputMethodManager inputManager = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        inputManager.hideSoftInputFromWindow(Objects.requireNonNull(getCurrentFocus()).getWindowToken(), InputMethodManager.HIDE_NOT_ALWAYS);

        int modeId = mode.getCheckedRadioButtonId();
        int minLength = 0;
        if (minLengthBox.getText().length() > 0) {
            minLength = Integer.parseInt(minLengthBox.getText().toString());
        }
        int maxLength = 100;
        if (maxLengthBox.getText().length() > 0) {
            maxLength = Integer.parseInt(maxLengthBox.getText().toString());
        }
        results.setText("Result:\n");

        int checkedDictionary = source.getCheckedRadioButtonId();
        String input = inputBox.getText().toString().toLowerCase();

        try {
            if (checkedDictionary == R.id.enRadioBtn) {
                enDict.findResults(input, modeId, minLength, maxLength);
            } else if (checkedDictionary == R.id.czPJRadioBtn) {
                czPJDict.findResults(input, modeId, minLength, maxLength);
            } else if (checkedDictionary == R.id.czRadioBtn) {
                czDict.findResults(input, modeId, minLength, maxLength);
            } else if (checkedDictionary == R.id.czBigRadioBtn) {
                czBigDict.findResults(input, modeId, minLength, maxLength);
            } else if (checkedDictionary == R.id.mapBrnoRadioBtn) {
                if (mLocation == null) {
                    acquireLocation();
                }
                brnoMap.setSvjz(svjz.isEnabled() && svjz.isChecked());
                brnoMap.setLocation(mLocation);
                brnoMap.findResults(input, modeId, minLength, maxLength);
            } else if (checkedDictionary == R.id.mapPragueRadioBtn) {
                if (mLocation == null) {
                    acquireLocation();
                }
                pragueMap.setSvjz(svjz.isEnabled() && svjz.isChecked());
                pragueMap.setLocation(mLocation);
                pragueMap.findResults(input, modeId, minLength, maxLength);
            } else {
                Utils.toastIt(getApplicationContext() , "No dictionary selected");
                return;
            }
        } catch (PatternSyntaxException e) {
            Utils.toastIt(getApplicationContext() , "Invalid regex syntax");
        } catch (Throwable e) {
            Utils.toastIt(getApplicationContext() , "Unknown error");
        }
        saveRadioButtons();
    }
}
