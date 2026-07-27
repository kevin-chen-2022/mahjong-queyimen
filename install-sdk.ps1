$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
$sdkManager = "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat"

Write-Host "正在接受所有许可协议..."
$yLines = @()
for ($i = 0; $i -lt 100; $i++) { $yLines += "y" }
$yLines | & $sdkManager --licenses 2>&1 | Select-Object -Last 3

Write-Host ""
Write-Host "正在安装 platform-tools, build-tools;34.0.0, platforms;android-34..."
$yLines | & $sdkManager "platform-tools" "build-tools;34.0.0" "platforms;android-34" 2>&1 | Select-Object -Last 10

Write-Host ""
Write-Host "验证安装..."
& "$env:ANDROID_HOME\platform-tools\adb.exe" version 2>&1 | Select-Object -First 1
