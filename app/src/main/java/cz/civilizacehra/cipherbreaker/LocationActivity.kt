package cz.civilizacehra.cipherbreaker

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle

import androidx.core.app.ActivityCompat
import androidx.fragment.app.FragmentActivity

abstract class LocationActivity : FragmentActivity(), LocationListener {

    private val mLocationManager by lazy { getSystemService(Context.LOCATION_SERVICE) as LocationManager }
    internal var mLocation: Location? = null

    override fun onPause() {
        super.onPause()
        ceaseLocation()
    }

    internal fun acquireLocation() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), 456)

            return
        }

        val isGps = mLocationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
        val isNetwork = mLocationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)

        if (isNetwork) {
            mLocationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0, 0f, this)
        }
        if (isGps) {
            mLocationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0f, this)
        }
        if (!isGps && !isNetwork) {
            applicationContext.toastIt("Enable Location")
        } else {
            applicationContext.toastIt("Acquiring Location...")
        }
    }

    private fun ceaseLocation() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return
        }
        mLocationManager.removeUpdates(this)
    }

    override fun onLocationChanged(location: Location) {
        mLocation = location
        applicationContext.toastIt("Location Acquired")
        ceaseLocation()
    }

    override fun onStatusChanged(provider: String, status: Int, extras: Bundle) {

    }

    override fun onProviderEnabled(provider: String) {

    }

    override fun onProviderDisabled(provider: String) {

    }
}
