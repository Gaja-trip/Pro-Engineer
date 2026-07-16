[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$appRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $appRoot
$tempRoot = [System.IO.Path]::GetTempPath()
$buildDir = Join-Path $tempRoot "ProEngineerAndroidBuild"
$distDir = Join-Path $repoRoot "dist"
$wwwDir = Join-Path $buildDir "assets\www"
$sourceRoot = Join-Path $appRoot "src\main"
$sourceManifest = Join-Path $sourceRoot "AndroidManifest.xml"
$sourceResDir = Join-Path $sourceRoot "res"
$sourceJava = Join-Path $sourceRoot "java\com\proengineer\study\MainActivity.java"
$stagedSourceRoot = Join-Path $buildDir "src"
$manifest = Join-Path $stagedSourceRoot "AndroidManifest.xml"
$resDir = Join-Path $stagedSourceRoot "res"
$javaDir = Join-Path $stagedSourceRoot "java\com\proengineer\study"
$javaSource = Join-Path $javaDir "MainActivity.java"

$sdkRoot = "C:\Users\Administrator\AppData\Local\Android\Sdk"
$buildTools = Join-Path $sdkRoot "build-tools\36.1.0"
$sourceAndroidJar = Join-Path $sdkRoot "platforms\android-36.1\android.jar"
$androidJar = Join-Path $buildDir "android.jar"
$jdkRoot = "C:\Program Files\Android\Android Studio\jbr"

$aapt = Join-Path $buildTools "aapt.exe"
$aapt2 = Join-Path $buildTools "aapt2.exe"
$d8 = Join-Path $buildTools "d8.bat"
$zipalign = Join-Path $buildTools "zipalign.exe"
$apksigner = Join-Path $buildTools "apksigner.bat"
$javac = Join-Path $jdkRoot "bin\javac.exe"
$keytool = Join-Path $jdkRoot "bin\keytool.exe"

$requiredPaths = @(
    (Join-Path $repoRoot "today-lecture.html"),
    (Join-Path $repoRoot "assets"),
    $sourceManifest,
    $sourceResDir,
    $sourceJava,
    $aapt,
    $aapt2,
    $d8,
    $zipalign,
    $apksigner,
    $javac,
    $keytool,
    $sourceAndroidJar
)

foreach ($path in $requiredPaths) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Required build input was not found: $path"
    }
}

$resolvedTempRoot = [System.IO.Path]::GetFullPath($tempRoot).TrimEnd('\')
$resolvedBuildDir = [System.IO.Path]::GetFullPath($buildDir).TrimEnd('\')
if (-not $resolvedBuildDir.StartsWith("$resolvedTempRoot\", [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to clean a build directory outside the system temp folder: $resolvedBuildDir"
}
if (Test-Path -LiteralPath $resolvedBuildDir) {
    Remove-Item -LiteralPath $resolvedBuildDir -Recurse -Force
}

$classesDir = Join-Path $buildDir "classes"
$dexDir = Join-Path $buildDir "dex"
New-Item -ItemType Directory -Force -Path $wwwDir, $classesDir, $dexDir, $distDir, $stagedSourceRoot, $javaDir | Out-Null

# Some Android command-line tools on Windows cannot read paths containing Korean
# characters. Stage all command-line inputs under the ASCII-only temp path.
Copy-Item -LiteralPath $sourceManifest -Destination $manifest
Copy-Item -LiteralPath $sourceResDir -Destination $stagedSourceRoot -Recurse
Copy-Item -LiteralPath $sourceJava -Destination $javaSource
Copy-Item -LiteralPath $sourceAndroidJar -Destination $androidJar

Get-ChildItem -LiteralPath $repoRoot -File -Filter "*.html" |
    Copy-Item -Destination $wwwDir
Copy-Item -LiteralPath (Join-Path $repoRoot "assets") -Destination $wwwDir -Recurse

$compiledResources = Join-Path $buildDir "compiled-res.zip"
& $aapt2 compile --dir $resDir -o $compiledResources
if ($LASTEXITCODE -ne 0) { throw "Android resource compilation failed." }

& $javac -encoding UTF-8 -source 8 -target 8 -classpath $androidJar -d $classesDir $javaSource
if ($LASTEXITCODE -ne 0) { throw "Java compilation failed." }

$previousJavaHome = $env:JAVA_HOME
$env:JAVA_HOME = $jdkRoot
try {
    $classFiles = @(Get-ChildItem -LiteralPath $classesDir -Recurse -File -Filter "*.class")
    if ($classFiles.Count -eq 0) { throw "No compiled Java classes were produced." }
    & $d8 --min-api 23 --lib $androidJar --output $dexDir $classFiles.FullName
    if ($LASTEXITCODE -ne 0) { throw "DEX compilation failed." }
} finally {
    $env:JAVA_HOME = $previousJavaHome
}

$unsignedApk = Join-Path $buildDir "app-unsigned.apk"
& $aapt2 link `
    -o $unsignedApk `
    -I $androidJar `
    --manifest $manifest `
    --min-sdk-version 23 `
    --target-sdk-version 36 `
    --version-code 1 `
    --version-name "1.0.0" `
    $compiledResources
if ($LASTEXITCODE -ne 0) { throw "APK resource linking failed." }

# Add web assets with forward-slash ZIP entry names. On Windows, aapt2 -A
# preserves backslashes in nested asset names, which Android cannot resolve.
$assetFiles = @(Get-ChildItem -LiteralPath (Join-Path $buildDir "assets") -Recurse -File)
$assetPaths = @($assetFiles | ForEach-Object {
    $_.FullName.Substring($buildDir.Length + 1).Replace('\', '/')
})
Push-Location $buildDir
try {
    & $aapt add $unsignedApk $assetPaths
    if ($LASTEXITCODE -ne 0) { throw "Adding web assets to the APK failed." }
} finally {
    Pop-Location
}

$classesDex = Join-Path $dexDir "classes.dex"
if (-not (Test-Path -LiteralPath $classesDex)) { throw "classes.dex was not produced." }
Push-Location $dexDir
try {
    & $aapt add $unsignedApk "classes.dex"
    if ($LASTEXITCODE -ne 0) { throw "Adding classes.dex to the APK failed." }
} finally {
    Pop-Location
}

$alignedApk = Join-Path $buildDir "app-aligned.apk"
& $zipalign -f 4 $unsignedApk $alignedApk
if ($LASTEXITCODE -ne 0) { throw "APK alignment failed." }

$keystore = Join-Path $appRoot "debug.keystore"
if (-not (Test-Path -LiteralPath $keystore)) {
    & $keytool `
        -genkeypair `
        -keystore $keystore `
        -storepass android `
        -alias androiddebugkey `
        -keypass android `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -dname "CN=Android Debug,O=Pro Engineer,C=KR" `
        -noprompt
    if ($LASTEXITCODE -ne 0) { throw "Debug signing key creation failed." }
}

$apkName = "ProEngineer-Study-v1.0.0.apk"
$apkPath = Join-Path $distDir $apkName
$temporaryApkPath = Join-Path $buildDir $apkName
if (Test-Path -LiteralPath $apkPath) {
    Remove-Item -LiteralPath $apkPath -Force
}

$previousJavaHome = $env:JAVA_HOME
$env:JAVA_HOME = $jdkRoot
try {
    & $apksigner sign `
        --ks $keystore `
        --ks-key-alias androiddebugkey `
        --ks-pass pass:android `
        --key-pass pass:android `
        --out $temporaryApkPath `
        $alignedApk
    if ($LASTEXITCODE -ne 0) { throw "APK signing failed." }

    & $apksigner verify --verbose --print-certs $temporaryApkPath
    if ($LASTEXITCODE -ne 0) { throw "APK signature verification failed." }
} finally {
    $env:JAVA_HOME = $previousJavaHome
}

& $zipalign -c -v 4 $temporaryApkPath
if ($LASTEXITCODE -ne 0) { throw "Final APK alignment verification failed." }

& $aapt dump badging $temporaryApkPath
if ($LASTEXITCODE -ne 0) { throw "Reading final APK metadata failed." }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($temporaryApkPath)
try {
    $entryNames = @($archive.Entries | ForEach-Object { $_.FullName })
    $requiredEntries = @(
        "assets/www/today-lecture.html",
        "assets/www/assets/css/styles.css",
        "assets/www/assets/js/today-lecture.js",
        "classes.dex"
    )
    foreach ($requiredEntry in $requiredEntries) {
        if ($entryNames -notcontains $requiredEntry) {
            throw "Required APK entry is missing: $requiredEntry"
        }
    }
    $invalidAssetEntries = @($entryNames | Where-Object {
        $_.StartsWith("assets/") -and $_.Contains('\')
    })
    if ($invalidAssetEntries.Count -ne 0) {
        throw "APK contains asset paths with Windows separators."
    }
    $packagedAssetCount = @($entryNames | Where-Object { $_.StartsWith("assets/") }).Count
    if ($packagedAssetCount -ne $assetFiles.Count) {
        throw "APK asset count mismatch: expected $($assetFiles.Count), found $packagedAssetCount"
    }
} finally {
    $archive.Dispose()
}

Copy-Item -LiteralPath $temporaryApkPath -Destination $apkPath

$hash = Get-FileHash -LiteralPath $apkPath -Algorithm SHA256
$hashPath = Join-Path $distDir "$apkName.sha256"
"$($hash.Hash.ToLowerInvariant())  $apkName" | Set-Content -LiteralPath $hashPath -Encoding ascii

$apk = Get-Item -LiteralPath $apkPath
Write-Host "APK_PATH=$($apk.FullName)"
Write-Host "APK_SIZE_BYTES=$($apk.Length)"
Write-Host "APK_SHA256=$($hash.Hash.ToLowerInvariant())"
