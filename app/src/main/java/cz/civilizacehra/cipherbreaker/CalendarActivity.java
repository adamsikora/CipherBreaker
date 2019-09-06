package cz.civilizacehra.cipherbreaker;

import android.app.Activity;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.view.WindowManager;
import android.widget.AdapterView;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

public class CalendarActivity extends Activity {

    Spinner daySpinner;
    Spinner monthSpinner;
    Spinner dayOfWeekSpinner;

    Switch sortBySwitch;

    EditText yearEditText;
    EditText queryEditText;

    TextView holidaysTextView;

    List<Holiday> holidays;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        this.getWindow().setSoftInputMode(
                WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN);
        setContentView(R.layout.activity_calendar);

        daySpinner = findViewById(R.id.daySpinner);
        monthSpinner = findViewById(R.id.monthSpinner);
        dayOfWeekSpinner = findViewById(R.id.dayOfWeekSpinner);

        sortBySwitch = findViewById(R.id.sortBySwitch);

        yearEditText = findViewById(R.id.yearEditText);
        queryEditText = findViewById(R.id.queryEditText);

        holidaysTextView = findViewById(R.id.holidaysTextView);

        int year = Calendar.getInstance().get(Calendar.YEAR);
        yearEditText.setText(String.valueOf(year));

        holidays = loadHolidays();

        updateHolidays();

        daySpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                updateHolidays();
            }
            public void onNothingSelected(AdapterView<?> parent) {}
        });
        monthSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                updateHolidays();
            }
            public void onNothingSelected(AdapterView<?> parent) {}
        });
        dayOfWeekSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                updateHolidays();
            }
            public void onNothingSelected(AdapterView<?> parent) {}
        });

        sortBySwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            public void onCheckedChanged(CompoundButton arg0, boolean isChecked) {
                updateHolidays();
            }
        });

        yearEditText.addTextChangedListener(new TextWatcher() {
            public void afterTextChanged(Editable s) {}
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                updateHolidays();
            }
        });
        queryEditText.addTextChangedListener(new TextWatcher() {
            public void afterTextChanged(Editable s) {}
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                try {
                    Pattern.compile(getQuery());
                } catch (PatternSyntaxException e) {
                    return;
                }
                updateHolidays();
            }
        });
    }

    private List<Holiday> loadHolidays() {
        List<Holiday> result = new ArrayList<>();
        int year = getYear();
        try {
            InputStream input = getApplicationContext().getAssets().open("holidays.txt");

            BufferedReader in = new BufferedReader(new InputStreamReader(input));
            String line;

            while((line = in.readLine()) != null) {
                String[] tokens = line.split(":");
                String data = tokens[1];
                String[] ints = tokens[0].split("-");
                int day = Integer.parseInt(ints[0]);
                int month = Integer.parseInt(ints[1]);
                result.add(new Holiday(year, month, day, data));
            }
        } catch (java.io.IOException e) {
            Utils.toastIt(getApplicationContext() , "Error loading holidays file");
        }

        return result;
    }

    private void updateHolidays() {
        try {
            Pattern.compile(getQuery());
        } catch (PatternSyntaxException e) {
            Utils.toastIt(getApplicationContext() , "Invalid regex syntax");
            return;
        }

        int year = getYear();
        boolean sortByName = getSortByName();
        for (Holiday holiday: holidays) {
            holiday.updateYear(year);
        }
        List<Holiday> filteredHolidays = filterHolidays();
        Collections.sort(filteredHolidays,
                sortByName ? Holiday.nameFirstComparator : Holiday.dateFirstComparator);
        StringBuilder toShow = new StringBuilder("\n");
        for (Holiday holiday: filteredHolidays) {
            toShow.append(holiday.toString(sortByName));
        }
        holidaysTextView.setText(toShow);
    }

    private List<Holiday> filterHolidays() {
        List<Holiday> result = new ArrayList<>();
        int day = getDay();
        int month = getMonth();
        String dayOfWeek = getDayOfWeek();
        String query = getQuery();
        for (Holiday holiday: holidays) {
            if (holiday.satisfiesFilters(day, month, dayOfWeek, query)) {
                result.add(holiday);
            }
        }
        return result;
    }

    private boolean getSortByName() {
        return sortBySwitch.isChecked();
    }

    private int parseWithDefault(String s) {
        return s.matches("-?\\d+") ? Integer.parseInt(s) : 0;
    }

    private int getYear() {
        return parseWithDefault(yearEditText.getText().toString());
    }
    private int getMonth() {
        return parseWithDefault(monthSpinner.getSelectedItem().toString());
    }
    private int getDay() {
        return parseWithDefault(daySpinner.getSelectedItem().toString());
    }
    private String getDayOfWeek() {
        return dayOfWeekSpinner.getSelectedItem().toString();
    }
    private String getQuery() {
        return queryEditText.getText().toString();
    }
}
