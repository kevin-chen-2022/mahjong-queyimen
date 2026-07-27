$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
$sdkManager = "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat"

Write-Host "正在安装 build-tools;35.0.0 和 platforms;android-35 ..."
$yLines = @()
for ($i = 0; $i -lt 100; $i++) { $yLines += "y" }
$yLines | & $sdkManager "build-tools;35.0.0" "platforms;android-35" 2>&1 | Select-Object -Last 10

Write-Host ""
Write-Host "验证安装..."
& $sdkManager --list_installed 2>&1 | Select-String "build-tools|platforms"
