#include <napi.h>
#include <node_api.h>
#include <windows.h>

bool isCoveredByWindow(HWND bottom, HWND top) {
    WINDOWINFO bottomWinInfo, topWinInfo;
    GetWindowInfo(bottom, &bottomWinInfo);
    GetWindowInfo(top, &topWinInfo);

    bool result = false;
    if (topWinInfo.rcClient.top >= bottomWinInfo.rcClient.top &&
        topWinInfo.rcClient.bottom >= bottomWinInfo.rcClient.bottom &&
        topWinInfo.rcClient.left >= bottomWinInfo.rcClient.left &&
        topWinInfo.rcClient.right >= bottomWinInfo.rcClient.right) {
        result = true;
    }

    return result;
}

Napi::Boolean isWindowCompletedCovered(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    HWND hwnd = reinterpret_cast<HWND>(info[0].As<Napi::Number>().Int64Value());
    bool isCovered = false;

    HMONITOR winMonitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);

    std::vector<HWND> windows;
    EnumWindows([](HWND handle, LPARAM lParam) {
        auto *windows = reinterpret_cast<std::vector<HWND> *>(lParam);
        windows->push_back(handle);
        return TRUE;
    }, reinterpret_cast<LPARAM>(&windows));

    for (HWND handle: windows) {
        bool isVisible = IsWindowVisible(handle);
        bool isZoomed = IsZoomed(handle);
        bool isCoveredWin = isCoveredByWindow(hwnd, handle);
        HMONITOR monitor = MonitorFromWindow(handle, MONITOR_DEFAULTTONULL);

        if (isVisible && isZoomed && isCoveredWin && monitor == winMonitor) {
            isCovered = true;
        }
    }

    return Napi::Boolean::New(env, isCovered);
}

bool checkIsFullScreen(HWND hWnd) {
    RECT windowRect;
    GetWindowRect(hWnd, &windowRect);

    HMONITOR monitor = MonitorFromWindow(hWnd, MONITOR_DEFAULTTONULL);
    if (monitor == nullptr) {
        return false;
    }

    MONITORINFO monitorInfo = {sizeof(monitorInfo)};
    GetMonitorInfo(monitor, &monitorInfo);

    LPRECT workArea = &monitorInfo.rcWork;
    LPRECT monitorRect = &monitorInfo.rcMonitor;

    return windowRect.left == monitorRect->left && windowRect.right == monitorRect->right &&
           (workArea->top == windowRect.top || workArea->bottom == windowRect.bottom);
}