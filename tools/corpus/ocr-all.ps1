<#
.SYNOPSIS
    OCR a folder of screenshots locally with Windows.Media.Ocr.

.DESCRIPTION
    No cloud service, no API key, no upload. Uses the OCR engine shipped with Windows.
    Writes one .txt per image into -Out, plus ocr-log.tsv.

    Requires Windows PowerShell 5.1 (Windows.Media.Ocr is a WinRT API and is not
    reachable from PowerShell 7 without extra interop).

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File tools\corpus\ocr-all.ps1 -Source F:\Wakandi -Out .\ocr
#>
param(
    [string]$Source = 'F:\Wakandi',
    [string]$Out = '.\ocr'
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Storage.StorageFile, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.IRandomAccessStream, Windows.Foundation, ContentType = WindowsRuntime]

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
        $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
    })[0]

function Await($t, $rt) {
    $m = $asTaskGeneric.MakeGenericMethod($rt)
    $nt = $m.Invoke($null, @($t))
    $nt.Wait(-1) | Out-Null
    $nt.Result
}

$eng = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if (-not $eng) { throw 'No OCR engine available on this machine.' }

New-Item -ItemType Directory -Force -Path $Out | Out-Null

$files = Get-ChildItem -LiteralPath $Source -File -Filter *.png | Sort-Object Name
$sw = [Diagnostics.Stopwatch]::StartNew()
$i = 0
$fail = 0
$log = New-Object System.Collections.Generic.List[string]

foreach ($f in $files) {
    $i++
    try {
        $sf = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($f.FullName)) ([Windows.Storage.StorageFile])
        $stream = Await ($sf.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
        $dec = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
        $bmp = Await ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
        $res = Await ($eng.RecognizeAsync($bmp)) ([Windows.Media.Ocr.OcrResult])
        $text = $res.Text
        $dest = Join-Path $Out ([IO.Path]::GetFileNameWithoutExtension($f.Name) + '.txt')
        [IO.File]::WriteAllText($dest, $text, [Text.Encoding]::UTF8)
        $log.Add("OK`t$($f.Name)`t$($text.Length)")
        $stream.Dispose()
        if ($i % 25 -eq 0) { Write-Host "$i/$($files.Count) images, $([int]$sw.Elapsed.TotalSeconds)s" }
    }
    catch {
        $fail++
        $log.Add("FAIL`t$($f.Name)`t$($_.Exception.Message)")
        Write-Warning "FAILED $($f.Name): $($_.Exception.Message)"
    }
}

$log | Set-Content -LiteralPath (Join-Path $Out '..\ocr-log.tsv') -Encoding UTF8
$sw.Stop()
Write-Host "`nDone: $($files.Count) images, $fail failures, $([int]$sw.Elapsed.TotalSeconds)s"
Write-Host "Output: $Out"
