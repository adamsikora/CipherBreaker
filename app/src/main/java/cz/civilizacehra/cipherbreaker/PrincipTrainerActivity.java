package cz.civilizacehra.cipherbreaker;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.ImageView;
import android.widget.Switch;
import android.widget.TextView;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Random;

public class PrincipTrainerActivity extends Activity {

    ImageView principy[] = new ImageView[6];
    Switch invertSwitch;

    ImageView imageView;
    ImageView solutions[] = new ImageView[5];

    TextView textView;
    Button nextButton;
    Button solutionButton;

    int mHihglightColor = 0xFF24872F;
    int mWrongColor = 0xFFBF3434;
    int mDefaultColor = 0xFFBBBBBB;

    boolean mInvert;
    String mPrincipy[] = {"n", "m", "b", "s", "bin", "t"};
    String mPrincip = "n";
    Random mRandom = new Random();
    int mCurrent = 0, mLast = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_princip_trainer);

        principy[0] = (ImageView)findViewById(R.id.nImage);
        principy[1] = (ImageView)findViewById(R.id.mImage);
        principy[2] = (ImageView)findViewById(R.id.bImage);
        principy[3] = (ImageView)findViewById(R.id.sImage);
        principy[4] = (ImageView)findViewById(R.id.binImage);
        principy[5] = (ImageView)findViewById(R.id.tImage);

        for (int i = 0; i < mPrincipy.length; ++i) {
            final int ii = i;
            if (i == 0) {
                principy[i].setBackgroundColor(mHihglightColor);
            } else {
                principy[i].setBackgroundColor(mDefaultColor);
            }
            principy[i].setOnClickListener(new View.OnClickListener() {
                public void onClick(View v) {
                    mPrincip = mPrincipy[ii];
                    for (int i = 0; i < mPrincipy.length; ++i) {
                        if (i == ii) {
                            principy[i].setBackgroundColor(mHihglightColor);
                        } else {
                            principy[i].setBackgroundColor(mDefaultColor);
                        }
                    }
                    newLetter();
                }
            });
        }

        invertSwitch = (Switch)findViewById(R.id.invertSwitch);
        invertSwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {

            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                mInvert = isChecked;
                newLetter();

            }
        });

        imageView = (ImageView)findViewById(R.id.imageView);

        solutions[0] = (ImageView)findViewById(R.id.solution1);
        solutions[1] = (ImageView)findViewById(R.id.solution2);
        solutions[2] = (ImageView)findViewById(R.id.solution3);
        solutions[3] = (ImageView)findViewById(R.id.solution4);
        solutions[4] = (ImageView)findViewById(R.id.solution5);

        for (int i = 0; i < 5; ++i) {
            final int ii = i;
            solutions[ii].setOnClickListener(new View.OnClickListener() {
                public void onClick(View v) {
                    if (ii == mCurrent){
                        new Thread(new Runnable() {
                            @Override
                            public void run() {
                                runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        solutions[ii].setBackgroundColor(mHihglightColor);
                                        textView.setTextColor(mHihglightColor);
                                        textView.setText("Correct !");
                                    }
                                });
                                try {
                                    Thread.sleep(300);
                                } catch (InterruptedException e) {
                                    e.printStackTrace();
                                }
                                runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        newLetter();
                                    }
                                });
                            }
                        }).start();
                    } else {
                        solutions[ii].setBackgroundColor(mWrongColor);
                        textView.setTextColor(mWrongColor);
                        textView.setText("Wrong !!!");
                    }
                }
            });
        }

        textView = (TextView)findViewById(R.id.textView);

        nextButton = (Button)findViewById(R.id.nextButton);
        nextButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                newLetter();
            }
        });

        solutionButton = (Button)findViewById(R.id.solutionButton);
        solutionButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                solutions[mCurrent].setBackgroundColor(mHihglightColor);
                /*textView.setTextColor(mHihglightColor);
                textView.setText("Correct !");*/
            }
        });

        setImage(principy[0], "principy/n/7.png");
        setImage(principy[1], "principy/m/16.png");
        setImage(principy[2], "principy/b/9.png");
        setImage(principy[3], "principy/s/13.png");
        setImage(principy[4], "principy/bin/21.png");
        setImage(principy[5], "principy/t/15.png");

        newLetter();
    }

    private void setImage(ImageView btn, String path) {
        InputStream is = null;
        try {
            is = this.getResources().getAssets().open(path);
        } catch (IOException e) {
            Log.w("EL", e);
        }

        Bitmap image = BitmapFactory.decodeStream(is);
        btn.setImageBitmap(image);
        imageView.setBackgroundColor(mDefaultColor);
    }

    private void newLetter() {
        for (int i = 0; i < 5; ++i) {
            solutions[i].setBackgroundColor(mDefaultColor);
            textView.setText("");
        }

        String mSource;
        String mOut;
        mCurrent = mRandom.nextInt(5);

        if (mInvert) {
            mSource = mPrincip;
            mOut = "a";
        } else {
            mSource = "a";
            mOut = mPrincip;
        }

        ArrayList<Integer> list = new ArrayList<>();
        for (int i=1; i<=26; i++) {
            if (i != mLast) {
                list.add(i);
            }
        }
        Collections.shuffle(list);
        for (int i=0; i<5; i++) {
            setImage(solutions[i], "principy/" + mSource + "/" + list.get(i) + ".png");
        }
        mLast = list.get(mCurrent);

        InputStream is = null;
        try {
            is = this.getResources().getAssets().open("principy/" + mOut + "/" + list.get(mCurrent) + ".png");
        } catch (IOException e) {
            Log.w("EL", e);
        }

        Bitmap image = BitmapFactory.decodeStream(is);
        imageView.setImageBitmap(image);
        imageView.setBackgroundColor(mDefaultColor);
    }
}
