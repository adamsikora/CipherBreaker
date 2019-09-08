package cz.civilizacehra.cipherbreaker;

import android.Manifest;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.PolylineOptions;

import java.util.Locale;
import java.util.Objects;

import androidx.core.app.ActivityCompat;
import androidx.fragment.app.FragmentActivity;

public class AzimutherActivity extends FragmentActivity implements OnMapReadyCallback, LocationListener {

    protected GoogleMap mMap;

    protected EditText latEditText, lonEditText, distEditText, angleEditText;
    protected Button currentLocationButton;

    ProgressDialog dialog;

    protected LocationManager mLocationManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_azimuther);
        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.azimutherMap);
        Objects.requireNonNull(mapFragment).getMapAsync(this);

        latEditText = findViewById(R.id.latitudeEditText);
        lonEditText = findViewById(R.id.longitudeEditText);
        distEditText = findViewById(R.id.distanceEditText);
        angleEditText = findViewById(R.id.angleEditText);
        currentLocationButton = findViewById(R.id.currBtn);

        currentLocationButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                acquireLocation();
            }
        });


        TextView.OnEditorActionListener onEdit = new TextView.OnEditorActionListener() {
            @Override
            public boolean onEditorAction(TextView v, int actionId, KeyEvent event) {
                if (actionId == EditorInfo.IME_ACTION_DONE) {
                    InputMethodManager imm = (InputMethodManager)v.getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
                    imm.hideSoftInputFromWindow(v.getWindowToken(), 0);
                    setLocation();
                    return true;
                }
                return false;
            }
        };

        latEditText.setOnEditorActionListener(onEdit);
        lonEditText.setOnEditorActionListener(onEdit);
        distEditText.setOnEditorActionListener(onEdit);
        angleEditText.setOnEditorActionListener(onEdit);
    }

    protected void setLocation() {
        double lat = getDouble(latEditText);
        double lon = getDouble(lonEditText);
        double dist = getDouble(distEditText);
        double angle = getDouble(angleEditText);
        if (!Double.isNaN(lat) && !Double.isNaN(lon)) {
            mMap.clear();
            LatLng loc = new LatLng(lat, lon);
            mMap.addMarker(new MarkerOptions().position(loc).title("Start").icon(
                    BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)));

            if (!Double.isNaN(dist) && !Double.isNaN(angle)) {
                LatLng dest = computeLatLng(lat, lon, dist, angle);
                mMap.addMarker(new MarkerOptions().position(dest).title("Destination"));
                mMap.addPolyline(new PolylineOptions().color(0xffff0000).add(loc, dest));
                LatLng southWest = new LatLng(
                        Math.min(loc.latitude, dest.latitude),
                        Math.min(loc.longitude, dest.longitude));
                LatLng northEast = new LatLng(
                        Math.max(loc.latitude, dest.latitude),
                        Math.max(loc.longitude, dest.longitude));
                LatLngBounds bounds = new LatLngBounds(southWest, northEast);
                mMap.moveCamera(CameraUpdateFactory.newLatLngBounds(bounds, 300));
            } else {
                mMap.moveCamera(CameraUpdateFactory.newLatLng(loc));
            }
        }
    }

    protected double getDouble(EditText et) {
        try {
            return Double.parseDouble(et.getText().toString());
        } catch(NumberFormatException e) {
            return Double.NaN;
        }
    }

    protected LatLng computeLatLng(double lat, double lon, double distance, double angle) {
        distance = distance / 6371000;
        angle = toRad(angle);
        lat = toRad(lat);
        lon = toRad(lon);

        double newLat = Math.asin(Math.sin(lat) * Math.cos(distance) +
                Math.cos(lat) * Math.sin(distance) * Math.cos(angle));

        double newLon = lon + Math.atan2(Math.sin(angle) * Math.sin(distance) * Math.cos(lat),
                Math.cos(distance) - Math.sin(lat) * Math.sin(newLat));

        return new LatLng(toDeg(newLat), toDeg(newLon));
    }

    protected double toRad(double degrees) {
        return degrees * Math.PI / 180;
    }


    protected double toDeg(double radians) {
        return radians * 180 / Math.PI;
    }


    /**
     * Manipulates the map once available.
     * This callback is triggered when the map is ready to be used.
     * This is where we can add markers or lines, add listeners or move the camera.
     * If Google Play services is not installed on the device, the user will be prompted to install
     * it inside the SupportMapFragment. This method will only be triggered once the user has
     * installed Google Play services and returned to the app.
     */
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;

        mMap.setOnMapLongClickListener(new GoogleMap.OnMapLongClickListener() {
            @Override
            public void onMapLongClick (LatLng latLng){
                setLatLon(latLng.latitude, latLng.longitude);
                Utils.toastIt(getApplicationContext() , "Set new starting location");
            }
        });
        mMap.getUiSettings().setRotateGesturesEnabled(false);
    }

    protected void setLatLon(double latitude, double longitude) {
        latEditText.setText(String.format(Locale.ENGLISH, "%.7f", latitude));
        lonEditText.setText(String.format(Locale.ENGLISH, "%.7f", longitude));
        setLocation();
    }

    private void acquireLocation() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions( this, new String[] {  android.Manifest.permission.ACCESS_FINE_LOCATION  }, 456 );

            return;
        }
        dialog = new ProgressDialog(AzimutherActivity.this);
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
            Utils.toastIt(getApplicationContext() , "Enable Location");
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
        setLatLon(location.getLatitude(), location.getLongitude());
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
}
