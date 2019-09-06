package cz.civilizacehra.cipherbreaker;

import android.content.res.AssetManager;
import android.location.Location;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.Collections;

class MapDictionary extends Dictionary {

    class Point implements Comparable<Point> {
        Point(float dist, String n) {
            distance = dist;
            name = n;
        }
        float distance;
        String name;

        @Override
        public int compareTo(final Point o) {
            if (this.distance != o.distance) {
                return Float.compare(this.distance, o.distance);
            } else {
                return this.name.compareTo(o.name);
            }
        }
    }

    MapDictionary(AssetManager manager, String filename, TextView results) {
        super(manager, filename, results);
        mSvjz = false;
    }

    void setSvjz(boolean svjz) {
        mSvjz = svjz;
    }

    void setLocation(Location location) {
        mLocation = location;
    }
    private Location mLocation;
    private ArrayList<Point> mSortedResults = new ArrayList<Point>();

    @Override
    public void findResults(String input, boolean subset, boolean exact, boolean superset, boolean hamming, boolean levenshtein, boolean regexp, int minLength, int maxLength) {

        prepare();

        setSuffix("");
        findResults_impl(input, subset, exact, superset, hamming, levenshtein, regexp, minLength, maxLength);
        if (mSvjz) {
            for (String s : mWorldSides) {
                processWithWorldSide(input, s, subset, exact, superset, hamming, levenshtein, regexp, minLength, maxLength);
            }
        }

        conclude(false);
    }

    @Override
    protected void prepare() {
        mSortedResults.clear();
        mStartTime = System.currentTimeMillis();
    }

    @Override
    protected void matched(String match) {

        String[] split = match.split(";");
        Double lat = .0;
        Double lon = .0;
        String name = split[0] + mSuffix;
        if (split.length >= 3) {
            lat = Double.parseDouble(split[split.length - 2]);
            lon = Double.parseDouble(split[split.length - 1]);
        }
        float distance = .0f;
        if (mLocation != null) {
            Location targetLocation = new Location("");
            targetLocation.setLatitude(lat);
            targetLocation.setLongitude(lon);
            distance = mLocation.distanceTo(targetLocation);
        }
        mSortedResults.add(new Point(distance, name));
    }

    @Override
    protected void conclude(boolean sort) {
        String resultStr = "";
        int counter = 0;
        Collections.sort(mSortedResults);
        for (Point point : mSortedResults) {
            ++counter;
            resultStr += point.name + " (" + Math.round(point.distance) + "m)\n";
            if (counter >= 3000) {
                break;
            }
        }
        mResults.setText("Result: (" + counter + ")" + computationTime() + "\n" + resultStr);
    }

    private void setSuffix(String s) {
        if (s.length() > 0) {
            mSuffix = " (" + s.toUpperCase() + ")";
        } else {
            mSuffix = "";
        }
    }

    private void processWithWorldSide(String input, String s, boolean subset, boolean exact, boolean superset, boolean hamming, boolean levenshtein, boolean regexp, int minLength, int maxLength) {
        String[] arr = s.split("");
        boolean contains = true;
        for (String c : arr) {
            if (!input.contains(c)) {
                contains = false;
            }
        }
        if (contains) {
            String modified = input;
            for (String c : arr) {
                modified = modified.replaceFirst(c, "");
            }
            setSuffix(s);
            findResults_impl(modified, subset, exact, superset, hamming, levenshtein, regexp, minLength, maxLength);
        }
    }

    private String mSuffix;
    private String[] mWorldSides = {"s", "sv", "sz", "v", "z", "j", "jv", "jz"};
    private boolean mSvjz;
}
