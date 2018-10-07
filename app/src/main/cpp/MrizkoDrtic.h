#pragma once

#include <vector>

#include "Trie.h"

struct DrtMrizku {
    Trie2 root;

    int getScore(const std::string &s);

    struct Crawler {
        Crawler(unsigned size, unsigned step) : indices(size, 0), step(step) {}

        bool next() {
            unsigned index = 0;
            while (indices[index] == step - 1) {
                indices[index] = 0;
                if (index + 1 == indices.size()) {
                    return false;
                }
                ++index;
            }
            ++indices[index];
            return true;
        }

        std::vector<int> indices;
        unsigned step;
    };

    struct Distributed {
        std::pair<char, int> ch[4];
    };

    bool isPerfectSquare(int n);

    std::string drtMrizku(std::string input);

};