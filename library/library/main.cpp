#include <node_api.h>
#include <napi.h>

#if defined(_WIN32) || defined(_WIN64)

#include "platforms/windows.cpp"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "isWindowCompletedCovered"), Napi::Function::New(env, isWindowCompletedCovered));
    return exports;
}

NODE_API_MODULE(addon, Init);

#endif
