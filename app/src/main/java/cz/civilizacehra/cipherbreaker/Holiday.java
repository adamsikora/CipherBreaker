package cz.civilizacehra.cipherbreaker;

import java.text.Collator;
import java.text.Normalizer;
import java.util.Calendar;
import java.util.Comparator;
import java.util.Locale;
import java.util.regex.Pattern;


public class Holiday {
    private static final String[] dayOfWeekList = {"-", "Ne", "Po", "Ut", "St", "Ct", "Pa", "So"};
    private static final Collator collator = Collator.getInstance(new Locale("cs","CZ"));

    Holiday(int year, int month, int day, String name) {
        mDay = day;
        mMonth = month;
        updateYear(year);

        mName = name;
    }

    void updateYear(int year) {
        Calendar c = Calendar.getInstance();
        c.set(year, mMonth - 1, mDay);

        mDayOfWeek = dayOfWeekList[c.get(Calendar.DAY_OF_WEEK)];
    }

    String toString(boolean nameFirst) {
        String date = String.format("%2d. %2d. (%s)", mDay, mMonth, mDayOfWeek);
        if (nameFirst) {
            return mName + "  " + date + "\n";
        } else {
            return date + "  " + mName + "\n";
        }
    }

    boolean satisfiesFilters(int day, int month, String dayOfWeek, String query) {
        String normalizedName = Normalizer.normalize(mName, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "");
        return (day == 0 || day == mDay) && (month == 0 || month == mMonth)
                && (dayOfWeek.equals("-") || dayOfWeek.equals(mDayOfWeek))
                && (query.isEmpty() || tryMatch(mName, query) || tryMatch(normalizedName, query));
    }

    private boolean tryMatch(String name, String query) {
        Pattern pattern = Pattern.compile(query);
        String test = name.toLowerCase();
        return pattern.matcher(test).find() || test.contains(query.toLowerCase());
    }

    public int getMonth() {
        return mMonth;
    }
    public int getDay() {
        return mDay;
    }
    public String getName() {
        return mName;
    }

    private int mDay, mMonth;
    private String mName, mDayOfWeek;


    static Comparator dateFirstComparator = new Comparator<Holiday>() {
        public int compare(Holiday h1, Holiday h2) {
            int result = Integer.compare(h1.getMonth(), h2.getMonth());
            if (result != 0) {
                return result;
            }
            result = Integer.compare(h1.getDay(), h2.getDay());
            if (result != 0) {
                return result;
            }
            return collator.compare(h1.getName(), h2.getName());
        }
    };
    static Comparator nameFirstComparator = new Comparator<Holiday>() {
        public int compare(Holiday h1, Holiday h2) {
            int result = collator.compare(h1.getName(), h2.getName());
            if (result != 0) {
                return result;
            }
            result = Integer.compare(h1.getMonth(), h2.getMonth());
            if (result != 0) {
                return result;
            }
            return Integer.compare(h1.getDay(), h2.getDay());
        }
    };
}
