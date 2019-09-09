package cz.civilizacehra.cipherbreaker;

import android.app.Activity;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewTreeObserver;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RadioGroup;
import android.widget.RelativeLayout;
import android.widget.ScrollView;

import java.util.ArrayList;

public abstract class DebaseatorActivity extends Activity {

    LinearLayout rowsLayout;
    ArrayList<View> rows = new ArrayList<>();
    LayoutInflater mLayoutInflater;
    RadioGroup alphabetStart;
    ScrollView mScrollView;

    int mBase = 0;
    int mBaseLength = 0;
    int mBaseMax = 0;
    int mRowLayout = 0;

    int[] bits;
    int[] results;

    final String[] alphabet = {"", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z" };
    final String[] chAlphabet = {"", "A", "B", "C", "D", "E", "F", "G", "H", "CH", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z" };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    protected final void commonPostCreate(int base, int baseLength, int rowLayout) {
        mBase = base;
        mBaseLength = baseLength;
        mBaseMax = (int)Math.pow(base, baseLength) - 1;

        mRowLayout = rowLayout;
        alphabetStart = findViewById(R.id.startRadioGroup);

        alphabetStart.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            public void onCheckedChanged(RadioGroup arg0, int id) {
                for (View row : rows) {
                    row.callOnClick();
                }
            }
        });

        mLayoutInflater = getLayoutInflater();

        rowsLayout = findViewById(R.id.rowsLayout);

        for (int i = 0; i < 30; ++i) {
            addRow();
        }

        mScrollView = findViewById(R.id.scrollView);
        mScrollView.getViewTreeObserver()
                .addOnScrollChangedListener(new ViewTreeObserver.OnScrollChangedListener() {
                    @Override
                    public void onScrollChanged() {
                        if (!mScrollView.canScrollVertically(1)) {
                            for (int i = 0; i < 30; ++i) {
                                addRow();
                            }
                        }
                    }
                });
    }

    protected final String getLetter(int i) {
        if (i < 0 || i > 26) {
            i = 0;
        }
        return alphabet[i];
    }

    protected final String getChLetter(int i) {
        if (i < 0 || i > 27) {
            i = 0;
        }
        return chAlphabet[i];
    }

    protected final void addRow() {
        final RelativeLayout layout = (RelativeLayout) mLayoutInflater.inflate(mRowLayout, null, false);
        rows.add(layout);
        rowsLayout.addView(layout);

        for (int j = 0; j < mBaseLength; ++j) {
            ImageView view = layout.findViewById(bits[j]);
            view.setTag(0);
            view.setImageResource(getResources().getIdentifier("@android:drawable/alert_light_frame", null, null));
        }

        layout.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                onRowClick(layout);
            }
        });

        for (int j = 0; j < mBaseLength; ++j) {
            final ImageView view = layout.findViewById(bits[j]);
            view.setOnClickListener(new View.OnClickListener()
            {
                private int counter = (int) view.getTag();

                public void onClick(View v)
                {
                    ++counter;
                    counter %= mBase;
                    view.setTag(counter);
                    if (counter == 0) {
                        view.setImageResource(getResources().getIdentifier("@android:drawable/alert_light_frame", null, null));
                    } else if (counter == mBase - 1) {
                        view.setImageResource(getResources().getIdentifier("@android:drawable/alert_dark_frame", null, null));
                    } else {
                        view.setImageResource(getResources().getIdentifier("@android:drawable/btn_check_off_holo", null, null));
                    }

                    layout.callOnClick();
                }
            });
        }
    }

    protected void onRowClick(RelativeLayout layout) {}
}
