cmake_minimum_required(VERSION 3.25)
project(workpaper-library)

set(CMAKE_CXX_STANDARD 17)

add_library(${PROJECT_NAME} SHARED library/main.cpp library/platforms/windows.cpp library/platforms/windows.h)

target_include_directories(${PROJECT_NAME} PRIVATE ${CMAKE_JS_INC} ${CMAKE_CURRENT_SOURCE_DIR}/node_modules/node-addon-api)
target_include_directories(${PROJECT_NAME} PRIVATE ${CMAKE_JS_INC} ${CMAKE_CURRENT_SOURCE_DIR}/node_modules/node-api-headers/include)