$projectSdkDir = "C:\Users\ASUS\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a5eece158cc3fe28a26ef86\android-sdk"

Write-Host "安装 platforms;android-36 ..."
$sdkManager = "$projectSdkDir\cmdline-tools\latest\bin\sdkmanager.bat"
$yLines = @()
for ($i = 0; $i -lt 100; $i++) { $yLines += "y" }
$yLines | & $sdkManager --sdk_root=$projectSdkDir "platforms;android-36" 2>&1 | Select-Object -Last 5

Write-Host ""
Write-Host "验证安装..."
& $sdkManager --sdk_root=$projectSdkDir --list_installed 2>&1 | Select-String "platforms"
