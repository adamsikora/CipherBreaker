package cz.civilizacehra.cipherbreaker;

import android.os.Bundle;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;

public class DebinarizatorActivity extends DebaseatorActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_debinarizator);
        bits = new int[]{ R.id.bit1, R.id.bit2, R.id.bit3, R.id.bit4, R.id.bit5 };
        results = new int[]{ R.id.result11, R.id.result12, R.id.result21, R.id.result22 };
        commonPostCreate(2, 5, R.layout.binaryrow);
    }

    @Override
    protected void onRowClick(RelativeLayout layout) {
        int[] values = new int[mBaseLength];
        for (int k = 0; k < mBaseLength; ++k) {
            ImageView view = layout.findViewById(bits[k]);
            int value = (int) view.getTag();
            values[k] = value;
        }

        int down = 0, up = 0;
        for (int k = 0; k < mBaseLength; ++k) {
            down *= mBase;
            down += values[k];
        }
        for (int k = mBaseLength - 1; k >= 0; --k) {
            up *= mBase;
            up += values[k];
        }
        int offset = alphabetStart.getCheckedRadioButtonId() == R.id.rbtn0 ? 1 : 0;

        if (up >= 0 && up <= mBaseMax) {
            TextView text = layout.findViewById(results[0]);
            text.setText(getLetter(up + offset));
            text = layout.findViewById(results[1]);
            text.setText(getLetter(mBaseMax - up + offset));
        }
        if (down >= 0 && down <= mBaseMax) {
            TextView text = layout.findViewById(results[2]);
            text.setText(getLetter(down + offset));
            text = layout.findViewById(results[3]);
            text.setText(getLetter(mBaseMax - down + offset));
        }
    }
}
