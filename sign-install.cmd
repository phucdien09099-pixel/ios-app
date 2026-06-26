@echo off
setlocal

title Sign and Install Android APK

REM Root project (đặt file CMD ở root project)
set ROOT=%~dp0
set ROOT=%ROOT:~0,-1%

set KEYSTORE=%ROOT%\release.keystore
set ANDROID=%ROOT%\src-tauri\gen\android

REM FIX build-tools version
set APKSIGNER=%LOCALAPPDATA%\Android\Sdk\build-tools\35.0.0\apksigner.bat

set INPUT_APK=%ANDROID%\app\build\outputs\apk\universal\release\app-universal-release-unsigned.apk
set OUTPUT_APK=%ANDROID%\app-release-signed.apk

echo.
echo ==== CHECK ====

if not exist "%APKSIGNER%" (
echo Build Tools 35.0.0 not found
pause
exit /b
)

if not exist "%KEYSTORE%" (
echo release.keystore not found
pause
exit /b
)

if not exist "%INPUT_APK%" (
echo unsigned apk not found
pause
exit /b
)

echo.
echo ==== SIGN ====

call "%APKSIGNER%" sign ^
--ks "%KEYSTORE%" ^
--ks-key-alias release-key ^
--out "%OUTPUT_APK%" ^
"%INPUT_APK%"

if errorlevel 1 (
echo Sign failed
pause
exit /b
)

echo.
echo ==== VERIFY ====

call "%APKSIGNER%" verify --verbose "%OUTPUT_APK%"

echo.
echo ==== INSTALL ====

adb devices
adb install -r "%OUTPUT_APK%"

echo.
echo DONE
pause
