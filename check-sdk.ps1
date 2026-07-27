$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
$sdkManager = "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat"

Write-Host "检查已安装的包..."
& $sdkManager --list_installed 2>&1 | Select-Object -First 30
