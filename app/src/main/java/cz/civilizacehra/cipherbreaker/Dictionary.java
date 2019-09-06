package cz.civilizacehra.cipherbreaker;

import android.content.res.AssetManager;
import android.widget.TextView;

import java.io.InputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

class Dictionary {
    Dictionary(AssetManager manager, String filename, TextView results) {
        mManager = manager;
        mFilename = filename;
        mResults = results;
    }

    public void findResults(String input, boolean subset, boolean exact, boolean superset, boolean hamming, boolean levenshtein, boolean regexp, int minLength, int maxLength) {

        prepare();

        findResults_impl(input, subset, exact, superset, hamming, levenshtein, regexp, minLength, maxLength);

        conclude(hamming || levenshtein);
    }

    void findResults_impl(String input, boolean subset, boolean exact, boolean superset, boolean hamming, boolean levenshtein, boolean regexp, int minLength, int maxLength) {

        Pattern pattern;
        Matcher matcher;
        pattern = Pattern.compile(input);

        int[] charCount = new int[26];
        for (int i = 0; i < input.length(); ++i) {
            int position = input.charAt(i) - 'a';
            if (position >= 0 && position < 26) {
                ++charCount[position];
            } else {
                assert(false);
            }
        }


        try {
            InputStream inputStream = mManager.open(mFilename);
            BufferedReader in = new BufferedReader(new InputStreamReader(inputStream));
            String line;

            while((line = in.readLine()) != null) {
                StringPair word = StringPair.fromString(line);
                String first = word.getFirst();

                if ((subset && first.length() > input.length())
                        || (superset && first.length() < input.length())
                        ||(exact && first.length() != input.length())
                        ||(hamming && first.length() != input.length())
                        ||(first.length() < minLength || first.length() > maxLength)) {
                    continue;
                }
                if (regexp) {
                    matcher = pattern.matcher(first);
                    if (matcher.matches()) {
                        matched(word.getSecond());
                    }
                } else if (hamming) {
                    int counter = 0;
                    for (int i = 0; i < first.length(); ++i) {
                        if (first.charAt(i) != input.charAt(i)) {
                            ++counter;
                        }
                    }
                    if (counter < 6) {
                        matched("(" + counter + ") " + word.getSecond());
                    }
                } else if (levenshtein) {
                    int d = levenshteinDistance(first, input);
                    if (d < 6) {
                        matched("(" + d + ") " + word.getSecond());
                    }
                } else {
                    int[] chars = new int[26];
                    for (int i = 0; i < first.length(); ++i) {
                        int position = first.charAt(i) - 'a';
                        if (position >= 0 && position < 26) {
                            ++chars[position];
                        } else {
                            assert (false);
                        }
                    }
                    for (int i = 0; i < 26; ++i) {
                        if (subset && charCount[i] < chars[i]) {
                            break;
                        }
                        if (exact && charCount[i] != chars[i]) {
                            break;
                        }
                        if (superset && charCount[i] > chars[i]) {
                            break;
                        }
                        if (i == 26 - 1) {
                            matched(word.getSecond());
                        }
                    }
                }
            }
        } catch (java.io.IOException e) {

        }
    }

    private int levenshteinDistance(String a, String b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        // i == 0
        int [] costs = new int [b.length() + 1];
        for (int j = 0; j < costs.length; j++)
            costs[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            // j == 0; nw = lev(i - 1, j)
            costs[0] = i;
            int nw = i - 1;
            for (int j = 1; j <= b.length(); j++) {
                int cj = Math.min(1 + Math.min(costs[j], costs[j - 1]), a.charAt(i - 1) == b.charAt(j - 1) ? nw : nw + 1);
                nw = costs[j];
                costs[j] = cj;
            }
        }
        return costs[b.length()];
    }

    protected void prepare() {
        mList.clear();
        mStartTime = System.currentTimeMillis();
    }

    protected void matched(String match) {
        mList.add(match);
    }

    protected void conclude(boolean sort) {
        String resultStr = "";
        int counter = 0;
        if (sort) {
            Collections.sort(mList);
        }
        for (String point : mList) {
            ++counter;
            resultStr += point + "\n";
            if (counter >= 3000) {
                break;
            }
        }
        mResults.setText("Result: (" + counter + ")" + computationTime() + "\n" + resultStr);
    }

    String computationTime() {
        return "  " + (System.currentTimeMillis() - mStartTime) / 1000.0 + "s ";
    }

    private ArrayList<String> mList = new ArrayList<>();

    private AssetManager mManager;
    private String mFilename;
    long mStartTime;
    TextView mResults;
}
