$projectSdkDir = "C:\Users\ASUS\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a5eece158cc3fe28a26ef86\android-sdk"
$existingSdk = "$env:LOCALAPPDATA\Android\Sdk"

Write-Host "复制现有 SDK 到项目目录..."
if (Test-Path $projectSdkDir) {
    Remove-Item $projectSdkDir -Recurse -Force
}
Copy-Item $existingSdk $projectSdkDir -Recurse -Force

Write-Host "安装 build-tools;35.0.0 和 platforms;android-35 ..."
$sdkManager = "$projectSdkDir\cmdline-tools\latest\bin\sdkmanager.bat"
$yLines = @()
for ($i = 0; $i -lt 100; $i++) { $yLines += "y" }
$yLines | & $sdkManager --sdk_root=$projectSdkDir "build-tools;35.0.0" "platforms;android-35" 2>&1 | Select-Object -Last 10

Write-Host ""
Write-Host "验证安装..."
& $sdkManager --sdk_root=$projectSdkDir --list_installed 2>&1 | Select-String "build-tools|platforms"
