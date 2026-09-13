# ziminOS installer bootstrap for Windows (Windows PowerShell 5.1 or later).
#
# [INPUT]: Windows PowerShell 5.1; HTTPS access to gitee.com and to one Python mirror
#          (npmmirror / Huawei Cloud / python.org, all pinned to the same SHA-256).
# [OUTPUT]: Downloads a verified portable Python (cached per user), the installer core and the
#           release package (verified against its .sha256), runs the core, and leaves the result in
#           <Target>\.ziminos-install-result.json. Exit code is the core's (0 ok, 10 upgrade, 20 refused, 30 failed).
# [POS]: The Windows entry point of installer/. It only prepares Python and downloads; every install
#        decision lives in ziminos_install.py. This file is ASCII-only on purpose: Windows PowerShell 5.1
#        reads BOM-less UTF-8 scripts in the ANSI code page, so any Chinese text here would become mojibake.
# [PROTOCOL]: Update this header when behaviour changes, then check installer/CLAUDE.md.
#
# Usage (copy exactly; it works from PowerShell, cmd and Git Bash because it contains no '$'):
#   powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol=3072; iwr -useb https://gitee.com/ziminzhao/zimin-os-v1/raw/main/installer/install.ps1 -OutFile ([IO.Path]::GetTempPath()+'ziminos-install.ps1'); & ([IO.Path]::GetTempPath()+'ziminos-install.ps1') -Edition free"

param(
    [ValidateSet('free', 'pro')] [string] $Edition = 'free',
    [string] $Target = (Get-Location).Path,
    [string] $Source = ''
)

$ErrorActionPreference = 'Stop'
# The progress bar makes Invoke-WebRequest many times slower on Windows PowerShell 5.1.
$ProgressPreference = 'SilentlyContinue'
# Older systems default to TLS 1.0/1.1, which gitee.com refuses.
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$Repos = @{
    free = 'https://gitee.com/ziminzhao/zimin-os-v1'
    pro  = 'https://gitee.com/ziminzhao/ziminos-pro'
}
$PythonVersion = '3.12.10'
$PythonSha256 = '4acbed6dd1c744b0376e3b1cf57ce906f9dc9e95e68824584c8099a63025a3c3'
$PythonUrls = @(
    "https://registry.npmmirror.com/-/binary/python/$PythonVersion/python-$PythonVersion-embed-amd64.zip",
    "https://mirrors.huaweicloud.com/python/$PythonVersion/python-$PythonVersion-embed-amd64.zip",
    "https://www.python.org/ftp/python/$PythonVersion/python-$PythonVersion-embed-amd64.zip"
)

$ResultPath = Join-Path $Target '.ziminos-install-result.json'
$Work = Join-Path ([IO.Path]::GetTempPath()) ('ziminos-install.' + [guid]::NewGuid().ToString('N').Substring(0, 8))

# Messages go to the host, never to the output stream: in PowerShell anything a function writes to the
# output stream becomes part of its return value, which would turn a returned path into an array.
function Write-Step([string] $Text) {
    Write-Host ('ziminOS: ' + $Text)
}

function Write-BootstrapFailure([string] $Message) {
    # Written as UTF-8 without a BOM (Set-Content on 5.1 would add one, or use the ANSI code page),
    # so any agent can parse it even when it cannot see this console.
    $json = @{ status = 'failed'; stage = 'bootstrap'; edition = $Edition; error = $Message } | ConvertTo-Json
    try {
        [IO.File]::WriteAllText($ResultPath, $json, (New-Object Text.UTF8Encoding $false))
    } catch {
        Write-Host ('ziminOS: could not write ' + $ResultPath + ': ' + $Message)
    }
    Write-Host 'ZIMINOS_RESULT status=failed exit=30'
}

function Invoke-Download([string] $Url, [string] $OutFile, [int] $TimeoutSec) {
    # Every download goes through here. Gitee now and then answers a single request with 451/403/429
    # or drops the connection, and the same request a few seconds later goes through; without a retry
    # that one hiccup would send the agent back to the slow step-by-step install.
    for ($attempt = 1; $attempt -le 4; $attempt++) {
        try {
            Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing -TimeoutSec $TimeoutSec
            return
        } catch {
            if ($attempt -eq 4) { throw $_ }
            Start-Sleep -Seconds (2 * $attempt)
        }
    }
}

function Save-Verified([string[]] $Urls, [string] $Sha256, [string] $OutFile) {
    $errors = @()
    foreach ($url in $Urls) {
        try {
            Invoke-Download $url $OutFile 900
            $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $OutFile).Hash.ToLowerInvariant()
            if ($actual -eq $Sha256.ToLowerInvariant()) { return }
            $errors += "$url returned a file with SHA-256 $actual"
        } catch {
            $errors += "$url failed: $($_.Exception.Message)"
        }
        Remove-Item -LiteralPath $OutFile -Force -ErrorAction SilentlyContinue
    }
    throw ('Could not download a verified copy of ' + [IO.Path]::GetFileName($OutFile) + ': ' + ($errors -join ' | '))
}

function Expand-ZipTo([string] $Zip, [string] $Destination) {
    # Expand-Archive is slow on Windows PowerShell 5.1; the .NET extractor is not.
    # Machines in Constrained Language Mode block .NET calls, so fall back to the tar.exe shipped with Windows 10+.
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [IO.Compression.ZipFile]::ExtractToDirectory($Zip, $Destination)
    } catch {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
        $code = Invoke-Native 'tar.exe' @('-xf', $Zip, '-C', $Destination)
        if ($code -ne 0) { throw "Could not extract $Zip" }
    }
}

function Invoke-Native([string] $Exe, [string[]] $Arguments) {
    # Windows PowerShell 5.1 turns a native program's stderr into terminating errors when
    # ErrorActionPreference is Stop; a stray warning from Python must not abort the install.
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $Exe @Arguments | Out-Host
        return $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previous
    }
}

function Test-Python([string] $Exe) {
    if (-not (Test-Path -LiteralPath $Exe)) { return $false }
    try {
        $code = Invoke-Native $Exe @('-c', 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)')
        return ($code -eq 0)
    } catch {
        return $false
    }
}

function Get-PortablePython {
    # Always our own portable Python: the "python" on a fresh Windows is a Microsoft Store shortcut,
    # and a Python the user happens to have may be too old or broken.
    $base = $env:LOCALAPPDATA
    if (-not $base) { $base = [IO.Path]::GetTempPath() }
    $dir = Join-Path (Join-Path $base 'ziminOS') "python-$PythonVersion-embed-amd64"
    $exe = Join-Path $dir 'python.exe'
    if (Test-Python $exe) { return $exe }

    Write-Step "downloading Python $PythonVersion (11 MB, once)"
    $zip = Join-Path $Work 'python.zip'
    Save-Verified $PythonUrls $PythonSha256 $zip
    $staging = "$dir.partial"
    if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
    Expand-ZipTo $zip $staging
    if (Test-Path -LiteralPath $dir) { Remove-Item -LiteralPath $dir -Recurse -Force }
    Move-Item -LiteralPath $staging -Destination $dir
    if (-not (Test-Python $exe)) { throw "Portable Python did not start: $exe" }
    return $exe
}

$exitCode = 30
try {
    $Target = (Resolve-Path -LiteralPath $Target).Path
    $ResultPath = Join-Path $Target '.ziminos-install-result.json'
    New-Item -ItemType Directory -Path $Work | Out-Null
    $repo = $Repos[$Edition]
    $python = Get-PortablePython

    Write-Step 'downloading installer'
    $core = Join-Path $Work 'ziminos_install.py'
    Invoke-Download "$repo/raw/main/installer/ziminos_install.py" $core 300

    if (-not $Source) {
        # Version from main's manifest, package straight from releases/download: no rate-limited API involved.
        $manifestFile = Join-Path $Work 'manifest.json'
        Invoke-Download "$repo/raw/main/vault/.obsidian/plugins/ziminos/manifest.json" $manifestFile 300
        $version = ([IO.File]::ReadAllText($manifestFile, [Text.Encoding]::UTF8) | ConvertFrom-Json).version
        if ($Edition -eq 'pro') { $name = "ziminOS-pro-v$version" } else { $name = "ziminOS-v$version-setup" }
        $zipUrl = "$repo/releases/download/v$version/$name.zip"

        $shaFile = Join-Path $Work "$name.zip.sha256"
        Invoke-Download "$zipUrl.sha256" $shaFile 300
        $expected = ([IO.File]::ReadAllText($shaFile) -split '\s+')[0]

        Write-Step "downloading $name.zip"
        $Source = Join-Path $Work "$name.zip"
        Save-Verified @($zipUrl) $expected $Source
    }

    Write-Step 'installing'
    $exitCode = Invoke-Native $python @($core, '--edition', $Edition, '--source', $Source, '--target', $Target, '--result', $ResultPath)
} catch {
    Write-BootstrapFailure $_.Exception.Message
    $exitCode = 30
} finally {
    if (Test-Path -LiteralPath $Work) {
        Remove-Item -LiteralPath $Work -Recurse -Force -ErrorAction SilentlyContinue
    }
}
exit $exitCode
