param(
    [string]$Mode = "debug"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $projectRoot "android"
$sdkDir = Join-Path $projectRoot "android-sdk"
$jdkDir = "C:\Program Files\Microsoft\jdk-21.0.9.10-hotspot"
$distDir = Join-Path $projectRoot "dist"

Write-Host "=== 麻将训练 APK 构建脚本 ===" -ForegroundColor Cyan
Write-Host "项目目录: $projectRoot"
Write-Host "SDK目录: $sdkDir"
Write-Host "JDK目录: $jdkDir"
Write-Host ""

# 设置环境变量
$env:JAVA_HOME = $jdkDir
$env:ANDROID_HOME = $sdkDir
$env:ANDROID_SDK_ROOT = $sdkDir
$env:Path = "$jdkDir\bin;$sdkDir\platform-tools;$env:Path"

# 1. 同步网页资源到 Android 项目
Write-Host "[1/3] 同步网页资源..." -ForegroundColor Yellow
Set-Location $projectRoot
npx cap sync android 2>&1 | Out-Null
Write-Host "  同步完成" -ForegroundColor Green

# 2. 构建 APK
Write-Host "[2/3] 构建 APK (${Mode})..." -ForegroundColor Yellow
Set-Location $androidDir

if ($Mode -eq "release") {
    .\gradlew.bat assembleRelease --no-daemon 2>&1 | Out-Null
    $apkPath = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
} else {
    .\gradlew.bat assembleDebug --no-daemon 2>&1 | Out-Null
    $apkPath = Join-Path $androidDir "app\build\outputs\apk\debug\app-debug.apk"
}

if (-not (Test-Path $apkPath)) {
    Write-Host "  构建失败！未找到APK文件" -ForegroundColor Red
    exit 1
}

$apkSize = [math]::Round((Get-Item $apkPath).Length / 1MB, 1)
Write-Host "  构建成功: ${apkSize} MB" -ForegroundColor Green

# 3. 复制到 dist 目录
Write-Host "[3/3] 复制到 dist 目录..." -ForegroundColor Yellow
$outputName = if ($Mode -eq "release") { "麻将训练-release.apk" } else { "麻将训练.apk" }
$outputPath = Join-Path $distDir $outputName
Copy-Item $apkPath $outputPath -Force
Write-Host "  已输出: $outputPath" -ForegroundColor Green

Write-Host ""
Write-Host "=== 构建完成 ===" -ForegroundColor Cyan
Write-Host "APK文件: $outputPath" -ForegroundColor Green
