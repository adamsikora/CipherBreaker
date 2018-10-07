#pragma once

#include <vector>

struct Trie {
	void countContainments(const char* start, char* curr, const char* end, int& result) const;
	void insert(char* s, char* end);

	std::vector<std::pair<char, Trie>> leaves;
	bool contained = false;
};

struct Trie2 { // 2x faster
	Trie2();
	void countContainments(const char* start, char* curr, const char* end, int& result) const;
	void insert(char* s, char* end);

	Trie2* leaves[26];
	bool contained = false;
};