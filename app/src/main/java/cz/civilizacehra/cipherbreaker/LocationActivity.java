package cz.civilizacehra.cipherbreaker;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;
import androidx.fragment.app.FragmentActivity;

public abstract class LocationActivity extends FragmentActivity implements LocationListener {

    LocationManager mLocationManager;
    Location mLocation;

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

    void acquireLocation() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions( this, new String[] {  android.Manifest.permission.ACCESS_FINE_LOCATION  }, 456 );

            return;
        }

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
            Utils.toastIt(getApplicationContext() , "Enable Location");
        } else {
            Utils.toastIt(getApplicationContext() , "Acquiring Location...");
        }
    }

    void ceaseLocation() {
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
        Utils.toastIt(getApplicationContext() , "Location Acquired");
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
