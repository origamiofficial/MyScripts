# Check the instructions here on how to use it "irm https://restore.rlabinc.org | iex"

$ErrorActionPreference = "Stop"
# Enable TLSv1.2 for compatibility with older clients for current session
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$DownloadURL = 'https://raw.githubusercontent.com/origamiofficial/MyScripts/main/Windows%20Bash%20Scripts/Windows_Health_Restore.cmd'
$DownloadURL2 = 'https://github.com/origamiofficial/MyScripts/raw/main/Windows%20Bash%20Scripts/Windows_Health_Restore.cmd'

$rand = Get-Random -Maximum 99999999
$isAdmin = [bool]([Security.Principal.WindowsIdentity]::GetCurrent().Groups -match 'S-1-5-32-544')
$FilePath = if ($isAdmin) { "$env:SystemRoot\Temp\Windows_Health_Restore_$rand.cmd" } else { "$env:TEMP\Windows_Health_Restore_$rand.cmd" }

try {
    $response = Invoke-WebRequest -Uri $DownloadURL -UseBasicParsing
}
catch {
    $response = Invoke-WebRequest -Uri $DownloadURL2 -UseBasicParsing
}

$ScriptArgs = "$args "
$prefix = "@REM $rand `r`n"
$content = $prefix + $response
Set-Content -Path $FilePath -Value $content

Start-Process $FilePath $ScriptArgs -Wait

$FilePaths = @("$env:TEMP\Windows_Health_Restore*.cmd", "$env:SystemRoot\Temp\Windows_Health_Restore*.cmd")
foreach ($FilePath in $FilePaths) { Get-Item $FilePath | Remove-Item }
