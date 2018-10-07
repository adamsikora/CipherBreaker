package cz.civilizacehra.cipherbreaker;

class StringPair {
    private String first;
    private String second;

    private StringPair(String first, String second) {
        super();
        this.first = first;
        this.second = second;
    }

    public boolean equals(Object other) {
        if (other instanceof StringPair) {
            StringPair otherPair = (StringPair) other;
            return
                    this.first != null && otherPair.first != null && this.first.equals(otherPair.first) &&
                            this.second != null && otherPair.second != null && this.second.equals(otherPair.second);
        }

        return false;
    }

    public String toString()
    {
        return "(" + first + ", " + second + ")";
    }

    static StringPair fromString(String input)
    {
        int index = input.indexOf(":");
        if (index > 0 && index < input.length()) {
            return new StringPair(input.substring(0, index), input.substring(index + 1, input.length()));
        } else {
            return new StringPair(input, input);
        }
    }

    String getFirst() {
        return first;
    }

    public void setFirst(String first) {
        this.first = first;
    }

    String getSecond() {
        return second;
    }

    public void setSecond(String second) {
        this.second = second;
    }
}
