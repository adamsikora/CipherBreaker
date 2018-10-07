#include <sstream>
#include <cstring>
#include <math.h>
#include <set>
#include <map>

#include <algorithm>

#include "MrizkoDrtic.h"

int DrtMrizku::getScore(const std::string& s)
{
	int result = 0;
	char start[256];
	std::memcpy(start, s.c_str(), s.size());
	for (unsigned i = 0; i < s.size(); ++i) {
		//int plus = 0;
		root.countContainments(start + i, start + i, start + s.size(), result);
		//result += plus;
		//for (unsigned j = 1; j <= s.size() - i; ++j) {
		//	if (root.contains(start + i, start + j)) {
		//		result += j;
		//	}
		//	//std::cout << s.substr(i, j) << " " << result << std::endl;
		//}
	}
	return result;
}

bool DrtMrizku::isPerfectSquare(int n)
{
	if (n < 0)
		return false;
	int root(round(sqrt(n)));
	return n == root * root;
}

std::string DrtMrizku::drtMrizku(std::string input)
{
	int size = input.size();
	if (!isPerfectSquare(size)) {
		return "wrong input size\n";
	}
	int sideLength = round(sqrt(size));
	int halfSideLength = sideLength / 2;
	int halfSideLengthExt = halfSideLength + sideLength % 2;
	int fourthSize = (sideLength*sideLength - size % 2) / 4;

	std::multimap<int, std::string> results;
	std::vector<Distributed> hints(fourthSize, Distributed());

	for (int i = 0; i < halfSideLength; ++i) {
		for (int j = 0; j < halfSideLengthExt; ++j) {
			//std::cout << i << "," << j << "," << i*halfSideLengthExt + j << "\n";
			int pos = i*halfSideLengthExt + j;
			int index = i*sideLength + j;
			hints[pos].ch[0] = { input[index], index };
			index = sideLength - 1 - i + j*sideLength;
			hints[pos].ch[1] = { input[index], index };
			index = size - 1 - (i*sideLength + j);
			hints[pos].ch[2] = { input[index], index };
			index = size - 1 - (sideLength - 1 - i + j*sideLength);
			hints[pos].ch[3] = { input[index], index };
		}
	}

	Crawler crawler(fourthSize, 4);
	do {
		std::vector<char> vec(size*4, 0);

		for (int i = 0; i < fourthSize; ++i) {
			for (int j = 0; j < 4; ++j) {
				auto temp = hints[i].ch[j];
				int index = size*((j - crawler.indices[i] + 4) % 4) + temp.second;
				vec[index] = temp.first;
			}
		}
		std::string toCheck;
		toCheck.reserve(size);
		for (auto c : vec) {
			if (c != 0) {
				toCheck.push_back(c);
			}
		}
		int score = getScore(toCheck);
		if (results.size() < 100) {
			results.insert({ score, toCheck });
		} else {
			if (score > results.begin()->first) {
				results.insert({ score, toCheck });
				results.erase(results.begin());
			}
		}
	} while (crawler.next());

	std::stringstream ss;
	for (auto it = results.rbegin(); it != results.rend(); ++it) {
		ss << it->second << " (" << it->first << ")\n";
	}
	return ss.str();
}