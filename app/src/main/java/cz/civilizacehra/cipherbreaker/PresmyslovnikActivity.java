package cz.civilizacehra.cipherbreaker;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.preference.PreferenceManager;
import android.support.v4.app.ActivityCompat;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.RadioGroup;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import java.util.regex.PatternSyntaxException;

public class PresmyslovnikActivity extends Activity implements LocationListener {

    private SharedPreferences sharedPreferences;

    Button goBtn;
    EditText inputBox;
    EditText minLengthBox;
    EditText maxLengthBox;
    TextView results;
    ScrollView scrollView;
    RadioGroup mode, source;
    CheckBox svjz;

    Dictionary enDict, czPJDict, czDict, czBigDict;
    MapDictionary pragueMap, brnoMap;

    ProgressDialog dialog;

    protected LocationManager mLocationManager;
    protected Location mLocation;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_presmyslovnik);

        goBtn = findViewById(R.id.GoBtn);
        inputBox = findViewById(R.id.inputEditText);
        minLengthBox = findViewById(R.id.minEditText);
        maxLengthBox = findViewById(R.id.maxEditText);
        results = findViewById(R.id.resultTextView);
        scrollView = findViewById(R.id.scrollView);
        mode = findViewById(R.id.modeRadioGrp);
        source = findViewById(R.id.sourceRadioGrp);
        svjz = findViewById(R.id.svjzCheckBox);

        source.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            public void onCheckedChanged(RadioGroup arg0, int id) {
                switch (id) {
                    case -1:
                        break;
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

        enDict = new Dictionary(getApplicationContext().getAssets(), "en.canon", results);
        czPJDict = new Dictionary(getApplicationContext().getAssets(), "podst_jm_cz.canon", results);
        czDict = new Dictionary(getApplicationContext().getAssets(), "cs_CZ_openoffice.canon", results);
        czBigDict = new Dictionary(getApplicationContext().getAssets(), "cs.canon", results);
        brnoMap = new MapDictionary(getApplicationContext().getAssets(), "map_brno.sifrohal", results);
        pragueMap = new MapDictionary(getApplicationContext().getAssets(), "map_prague.sifrohal", results);

        mLocationManager = (LocationManager) this.getSystemService(Context.LOCATION_SERVICE);
        final AlertDialog.Builder builder = new  AlertDialog.Builder(this);

        inputBox.requestFocus();

        if (goBtn != null) {
            goBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {

                    InputMethodManager inputManager = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                    inputManager.hideSoftInputFromWindow(getCurrentFocus().getWindowToken(), InputMethodManager.HIDE_NOT_ALWAYS);

                    int checked = mode.getCheckedRadioButtonId();
                    boolean subset = checked == R.id.subsetRadioBtn;
                    boolean exact = checked == R.id.exactRadioBtn;
                    boolean superset = checked == R.id.supersetRadioBtn;
                    boolean regexp = checked == R.id.regExpRadioBtn;
                    boolean hamming = checked == R.id.hammingRadioBtn;
                    boolean levenshtein = checked == R.id.levenshteinRadioBtn;
                    assert (subset ^ exact ^ superset ^ regexp ^ hamming ^ levenshtein);
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
                            enDict.findResults(input, subset, exact, superset, hamming, levenshtein, regexp, minLength, maxLength);
                        } else if (checkedDictionary == R.id.czPJRadioBtn) {
                            czPJDict.findResults(input, subset, exact, superset, hamming, levenshtein, regexp, minLength, maxLength);
                        } else if (checkedDictionary == R.id.czRadioBtn) {
                            czDict.findResults(input, subset, exact, superset, hamming, levenshtein, regexp, minLength, maxLength);
                        } else if (checkedDictionary == R.id.czBigRadioBtn) {
                            czBigDict.findResults(input, subset, exact, superset, hamming, levenshtein, regexp, minLength, maxLength);
                        } else if (checkedDictionary == R.id.mapBrnoRadioBtn) {
                            if (mLocation == null) {
                                acquireLocation();
                            }
                            brnoMap.setSvjz(svjz.isEnabled() && svjz.isChecked());
                            brnoMap.setLocation(mLocation);
                            brnoMap.findResults(input, subset, exact, superset, hamming, levenshtein, regexp, minLength, maxLength);
                        } else if (checkedDictionary == R.id.mapPragueRadioBtn) {
                            if (mLocation == null) {
                                acquireLocation();
                            }
                            pragueMap.setSvjz(svjz.isEnabled() && svjz.isChecked());
                            pragueMap.setLocation(mLocation);
                            pragueMap.findResults(input, subset, exact, superset, hamming, levenshtein, regexp, minLength, maxLength);
                        } else {
                            assert (false);
                        }
                    } catch (PatternSyntaxException e) {
                        builder
                                .setTitle("Invalid regex syntax")
                                .setPositiveButton(android.R.string.ok, new DialogInterface.OnClickListener() {
                                    public void onClick(DialogInterface dialog, int which) {
                                        // continue with delete
                                    }
                                })
                                .setIcon(android.R.drawable.ic_dialog_alert)
                                .show();
                    } catch (Throwable e) {
                        builder
                                .setTitle("Unknown error")
                                .setPositiveButton(android.R.string.ok, new DialogInterface.OnClickListener() {
                                    public void onClick(DialogInterface dialog, int which) {
                                        // continue with delete
                                    }
                                })
                                .setIcon(android.R.drawable.ic_dialog_alert)
                                .show();
                    }
                    saveRadioButtons();
                }
            });
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        ceaseLocation();
    }

    @Override
    protected void onResume() {
        super.onResume();
        /*if (mLocationManager != null) {
            acquireLocation();
        }*/
    }

    private void acquireLocation() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions( this, new String[] {  android.Manifest.permission.ACCESS_FINE_LOCATION  }, 456 );

            return;
        }
        dialog = new ProgressDialog(PresmyslovnikActivity.this);
        dialog.show();
        dialog.setMessage("Getting Coordinates");
        mLocationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);

        boolean isGps = mLocationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
        boolean isNetwork = mLocationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);

        if (isNetwork) {
            mLocationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0, 0, this);
        }
        if (isGps) {
            mLocationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0, this);
        }
        if (!isGps && !isNetwork) {
            dialog.dismiss();

            Toast.makeText(getApplicationContext(), "Enable Location", Toast.LENGTH_LONG).show();
        }
    }

    private void ceaseLocation() {
        if (mLocationManager != null) {
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                return;
            }
            mLocationManager.removeUpdates(this);
        }
    }

    @Override
    public void onLocationChanged(Location location) {
        mLocation = location;
        dialog.dismiss();
        ceaseLocation();
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {

    }

    @Override
    public void onProviderEnabled(String provider) {

    }

    @Override
    public void onProviderDisabled(String provider) {

    }

    private void saveRadioButtons(){
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putInt("modeRadioButton", mode.getCheckedRadioButtonId());
        editor.putInt("sourceRadioButton", source.getCheckedRadioButtonId());
        editor.apply();
    }

    public void loadRadioButtons(){
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        mode.check(sharedPreferences.getInt("modeRadioButton", mode.getCheckedRadioButtonId()));
        source.check(sharedPreferences.getInt("sourceRadioButton", source.getCheckedRadioButtonId()));
    }

    public void refreshSvjz(int sourceId, int modeId) {
        svjz.setEnabled((sourceId == R.id.mapBrnoRadioBtn || sourceId == R.id.mapPragueRadioBtn) &&
                (modeId == R.id.exactRadioBtn || modeId == R.id.supersetRadioBtn)
        );
    }
}
