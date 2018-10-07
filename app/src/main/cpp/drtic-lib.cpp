#include <jni.h>
#include <string>

#include <sys/types.h>
#include <android/asset_manager.h>
#include <android/asset_manager_jni.h>

#include "MrizkoDrtic.h"

DrtMrizku drtic;

extern "C"
JNIEXPORT jstring JNICALL
Java_cz_civilizacehra_cipherbreaker_MrizkoDrticActivity_grindGrid(JNIEnv *env, jobject /* this */, jstring input) {
    const char *cstr = env->GetStringUTFChars(input, NULL);
    std::string str = std::string(cstr);
    env->ReleaseStringUTFChars(input, cstr);
    std::string output = drtic.drtMrizku(str);
    return env->NewStringUTF(output.c_str());
}

extern "C"
JNIEXPORT void JNICALL
Java_cz_civilizacehra_cipherbreaker_MrizkoDrticActivity_initializeTrie(JNIEnv* env, jclass clazz, jobject assetManager)
{
    // use asset manager to open asset by filename
    AAssetManager* mgr = AAssetManager_fromJava(env, assetManager);

    AAsset* testAsset = AAssetManager_open(mgr, "sorted.canon", AASSET_MODE_UNKNOWN);
    if (testAsset) {

        size_t assetLength = AAsset_getLength(testAsset);

        char* buffer = new char[assetLength + 1];
        AAsset_read(testAsset, buffer, assetLength);
        buffer[assetLength] = 0;

        char* start = buffer;
        char* c = buffer;
        while (c[0] != 0) {
            if (c[0] == '\r') {
                drtic.root.insert(start, c);
                start = c + 2;
                ++c;
            }
            ++c;
        }

        AAsset_close(testAsset);
        delete[] buffer;
    }
}