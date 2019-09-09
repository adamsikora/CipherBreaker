package cz.civilizacehra.cipherbreaker;

import android.content.Context;
import android.location.Location;
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

public class AzimutherActivity extends LocationActivity implements OnMapReadyCallback {

    GoogleMap mMap;

    EditText latEditText, lonEditText, distEditText, angleEditText;
    Button currentLocationButton;

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

    void setLocation() {
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

    double getDouble(EditText et) {
        try {
            return Double.parseDouble(et.getText().toString());
        } catch(NumberFormatException e) {
            return Double.NaN;
        }
    }

    LatLng computeLatLng(double lat, double lon, double distance, double angle) {
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

    double toRad(double degrees) {
        return degrees * Math.PI / 180;
    }


    double toDeg(double radians) {
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

    @Override
    public void onLocationChanged(Location location) {
        setLatLon(location.getLatitude(), location.getLongitude());
        super.onLocationChanged(location);
    }

    void setLatLon(double latitude, double longitude) {
        latEditText.setText(String.format(Locale.ENGLISH, "%.7f", latitude));
        lonEditText.setText(String.format(Locale.ENGLISH, "%.7f", longitude));
        setLocation();
    }
}
