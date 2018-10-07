cmake_minimum_required(VERSION 3.6)

set( CMAKE_CXX_STANDARD 14 )
set(CMAKE_BUILD_TYPE Release)
set(CMAKE_FLAGS "${CMAKE_FLAGS} -O3")

# Specifies a library name, specifies whether the library is STATIC or
# SHARED, and provides relative paths to the source code. You can
# define multiple libraries by adding multiple add.library() commands,
# and CMake builds them for you. When you build your app, Gradle
# automatically packages shared libraries with your APK.

add_library( # Specifies the name of the library.
        MrizkoDrtic

        # Sets the library as a shared library.
        SHARED

        # Provides a relative path to your source file(s).
        src/main/cpp/drtic-lib.cpp
        src/main/cpp/MrizkoDrtic.cpp
        src/main/cpp/Trie.cpp )

find_library( # Sets the name of the path variable.
        log-lib

        # Specifies the name of the NDK library that
        # you want CMake to locate.
        log )

find_library( # Sets the name of the path variable.
        android-lib

        # Specifies the name of the NDK library that
        # you want CMake to locate.
        android )

# Specifies libraries CMake should link to your target library. You
# can link multiple libraries, such as libraries you define in this
# build script, prebuilt third-party libraries, or system libraries.

target_link_libraries( # Specifies the target library.
        MrizkoDrtic

        # Links the target library to the log library
        # included in the NDK.
        ${log-lib}
        ${android-lib})