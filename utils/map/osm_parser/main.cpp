#include <chrono>
#include <iomanip>
#include <iostream>
#include <fstream>
#include <sstream>
#include <string>

#include <map>
#include <unordered_map>

using Clock = std::chrono::high_resolution_clock;

enum TagType {
	start = 0,
	end = 1,
	whole = 2,
};

struct ParsedTag {
	TagType type;
	int depth;
	std::string element;
	std::unordered_map<std::string, std::string> attributes;
};

struct Feature {
	std::string element;
	int64_t id = 0;
	int64_t best_ref = 0;
	int best_ref_type = 0; // 10 relation excursion, 11 relation subarea, 20 way outer, 21 way inner, 30 node, 31 node admin_centre
	std::pair<float, float> location = { 0.0, 0.0 };
	std::string name;
	std::string ele;
	std::string natural;
};

std::unordered_map<std::string, std::string> parseAttributes(const std::string& attributes)
{
	std::unordered_map<std::string, std::string> result;

	int offset = 0;
	while (offset < attributes.size()) {
		int name_end = attributes.find('=', offset);
		if (name_end == std::string::npos) {
			std::cout << "Error parsing attributes: " << attributes << std::endl;
			return result;
		}
		std::string name = attributes.substr(offset, name_end - offset);

		int value_start = attributes.find('"', name_end);
		if (value_start == std::string::npos) {
			std::cout << "Error parsing attributes: " << attributes << std::endl;
			return result;
		}
		++value_start;
		int value_end = attributes.find('"', value_start);
		if (value_end == std::string::npos) {
			std::cout << "Error parsing attributes: " << attributes << std::endl;
			return result;
		}
		std::string value = attributes.substr(value_start, value_end - value_start);
		result[name] = value;
		offset = value_end + 2;
	}

	return result;
}

ParsedTag parseTag(const std::string& line)
{
	ParsedTag result;
	int i = 0;
	char c;
	while ((c = line[i]) == '\t') {
		++i;
	}
	if (i > 2) {
		std::cout << "Too deep" << std::endl;
		throw i;
	}
	result.depth = i;
	if (line[i] != '<' || line[line.size() - 1] != '>') {
		std::cout << "Invalid tag: " << line << std::endl;
		throw line;
	}
	int start_offset = i + 1;
	int end_offset = line.size() - 1;
	if (line[i + 1] == '/') {
		result.type = TagType::end;
		++start_offset;
	} else if (line[line.size() - 2] == '/') {
		result.type = TagType::whole;
		--end_offset;
	} else {
		result.type = TagType::start;
	}
	//std::string data = line.substr(start_offset, end_offset - start_offset);
	//std::cout << result.depth << " " << result.type << " " << data << std::endl;
	if (result.type == TagType::end) {
		result.element = line.substr(start_offset, end_offset - start_offset);
		return result;
	} else {
		int tag_end = start_offset;
		while (line[tag_end] != ' ') {
			++tag_end;
		}
		result.element = line.substr(start_offset, tag_end - start_offset);
		std::string attributes = line.substr(++tag_end, end_offset - tag_end);
		result.attributes = parseAttributes(attributes);
		return result;
	}
}

int main()
{
	auto start = Clock::now();
	std::ifstream infile("C:/Users/adams/Downloads/czech-republic-latest.osm");
	std::string line;
	int index = 0;
	int n_named_features = 0;
	int n_inserted_features = 0;
	int n_peak_features = 0;

	std::cout << "Allocating container for coordinates..." << std::endl;
	std::map<int64_t, std::pair<float, float>> coordinates;
	std::vector<std::pair<std::string, std::pair<float, float>>> locations;
	locations.reserve(300'000);
	std::list<Feature> unresolved_refs;

	// parse out xml header
	std::getline(infile, line);

	bool is_written = true;
	Feature curr_feature;
	while (std::getline(infile, line)) {
		ParsedTag parsed_tag = parseTag(line);
		if (parsed_tag.element == "node" && (parsed_tag.type == TagType::start || parsed_tag.type == TagType::whole)) {
			const std::unordered_map<std::string, std::string>& attributes = parsed_tag.attributes;
			try {
				coordinates[std::stoll(parsed_tag.attributes["id"])] = { std::stof(parsed_tag.attributes["lat"]), std::stof(parsed_tag.attributes["lon"]) };
			} catch (...) {
				std::cout << "Needed attributes are missing: ";
				for (auto it = attributes.begin(); it != attributes.end(); ++it) {
					std::cout << it->first << "=" << it->second << " ";
				}
				std::cout << std::endl;
			}
		}
		if (parsed_tag.depth == 1) {
			if (parsed_tag.type == TagType::start) {
				// start of significant node
				if (!is_written) {
					std::cout << "Last element was not written: " << curr_feature.element << std::endl;
				}
				is_written = false;
				curr_feature = Feature();
				curr_feature.element = parsed_tag.element;
				curr_feature.id = std::stoll(parsed_tag.attributes["id"]);
				if (parsed_tag.element == "node") {
					curr_feature.location = { std::stof(parsed_tag.attributes["lat"]), std::stof(parsed_tag.attributes["lon"]) };
				}

			} else if (parsed_tag.type == TagType::end) {
				// end of significant node
				is_written = true;
				// modify name for peaks
				if (curr_feature.natural == "peak") {
					if (!curr_feature.ele.empty()) {
						std::string name = curr_feature.ele + "mnm";
						if (!curr_feature.name.empty()) {
							name += " " + curr_feature.name;
						}
						curr_feature.name = name;
						++n_peak_features;
					}
				}

				// resolve location and insert
				if (curr_feature.element != "node") {
					if (curr_feature.best_ref != 0) {
						if (coordinates.count(curr_feature.best_ref) > 0) {
							curr_feature.location = coordinates[curr_feature.best_ref];
						} else {
							unresolved_refs.push_back(curr_feature);
						}
					} else {
						std::cout << "No best ref" << std::endl;
					}
				}
				if (curr_feature.location.first == 0.0 || curr_feature.location.second == 0.0) {
					// std::cout << "Unresolved location: " << curr_feature.element << " " << curr_feature.name << std::endl;
				} else {
					coordinates[curr_feature.id] = curr_feature.location;
					if (!curr_feature.name.empty()) {
						locations.emplace_back(curr_feature.name, curr_feature.location);
						++n_inserted_features;
					}
				}

			} else if (parsed_tag.element != "node" && parsed_tag.element != "bounds") {
				std::cout << "Unexpected element: " << parsed_tag.element << std::endl;
			}

		} else if (parsed_tag.depth == 2) {
			// children of significant node
			if (parsed_tag.element == "member") {
				const std::string& type = parsed_tag.attributes["type"];
				if (type == "node") {
					if (parsed_tag.attributes.count("admin_centre") > 0) {
						if (curr_feature.best_ref_type < 31) {
							curr_feature.best_ref = std::stoll(parsed_tag.attributes["ref"]);
							curr_feature.best_ref_type = 31;
						} else {
							std::cout << "Multiple admin centres." << std::endl;
						}
					} else {
						if (curr_feature.best_ref_type < 30) {
							curr_feature.best_ref = std::stoll(parsed_tag.attributes["ref"]);
							curr_feature.best_ref_type = 30;
						}
					}
				} else if (type == "way") {
					const std::string& role = parsed_tag.attributes["role"];
					if (role == "inner") {
						if (curr_feature.best_ref_type < 21) {
							curr_feature.best_ref = std::stoll(parsed_tag.attributes["ref"]);
							curr_feature.best_ref_type = 21;
						}
					} else {
						if (curr_feature.best_ref_type < 20) {
							curr_feature.best_ref = std::stoll(parsed_tag.attributes["ref"]);
							curr_feature.best_ref_type = 20;
						}
					}
				} else if (type == "relation") {
					const std::string& role = parsed_tag.attributes["role"];
					if (role == "subarea") {
						if (curr_feature.best_ref_type < 11) {
							curr_feature.best_ref = std::stoll(parsed_tag.attributes["ref"]);
							curr_feature.best_ref_type = 11;
						}
					} else {
						if (curr_feature.best_ref_type < 10) {
							curr_feature.best_ref = std::stoll(parsed_tag.attributes["ref"]);
							curr_feature.best_ref_type = 10;
						}
					}
				} else {
					std::cout << "Unexpected member type: " << type << std::endl;
				}
			} else if (parsed_tag.element == "nd") {
				if (curr_feature.best_ref_type < 30) {
					curr_feature.best_ref = std::stoll(parsed_tag.attributes["ref"]);
					curr_feature.best_ref_type = 30;
				}
			} else if (parsed_tag.element == "tag") {
				const std::string& key = parsed_tag.attributes["k"];
				const std::string& val = parsed_tag.attributes["v"];
				if (key == "natural") {
					curr_feature.natural = val;
				} else if (key == "name") {
					curr_feature.name = val;
				} else if (key == "ele") {
					curr_feature.ele = val;
				}

			} else {
				std::cout << "Unexpected child element: " << parsed_tag.element << std::endl;
			}
		}

		++index;
		if (line.find("\"name\"") != std::string::npos) {
			++n_named_features;
		}
		if (index % 1'000'000 == 0) {
			std::cout << index << " : " << n_named_features << " : " << coordinates.size() << std::endl;
		}
		//if (index > 100000) break;
	}
	std::cout << index << " : " << n_named_features << " : " << coordinates.size() << std::endl;

	// resolve unresolved locations
	int n_unresolved = unresolved_refs.size();
	int n_resolved = 1;
	while (!unresolved_refs.empty() && n_resolved > 0) {
		std::cout << "Resolving unresolved: " << unresolved_refs.size() << std::endl;
		n_resolved = 0;
		for (auto it = unresolved_refs.begin(); it != unresolved_refs.end();) {
			bool should_remove = false;
			if (coordinates.count(it->best_ref) > 0) {
				it->location = coordinates[it->best_ref];
				if (it->location.first == 0.0 || it->location.second == 0.0) {
					std::cout << "Incorrectly resolved location: " << it->element << " " << it->name << std::endl;
				} else {
					coordinates[it->id] = it->location;
					if (!it->name.empty()) {
						locations.emplace_back(it->name, it->location);
						++n_inserted_features;
					}
					should_remove = true;
				}
			} else {
				// std::cout << "Still unresolved: " << it->element << " " << it->name << std::endl;
			}
			if (should_remove) {
				unresolved_refs.erase(it++);
				++n_resolved;
			} else {
				++it;
			}
		}
	}
	std::cout << unresolved_refs.size() << " left unresolved" << std::endl;
	std::cout << n_inserted_features << " : " << n_peak_features << std::endl;

	std::ofstream output;
	output.open("cz.cbmap");
	for (const auto& item : locations) {
		output << std::fixed << std::setprecision(7);
		std::string name = item.first;
		output << item.first << ";" << item.second.first << ";" << item.second.second << std::endl;
	}

	double seconds = std::chrono::duration_cast<std::chrono::milliseconds>(Clock::now() - start).count() / 1000.0;
	std::cout << "Computation took: " << seconds << " seconds" << std::endl;
	std::cin.ignore();

	return 0;
}