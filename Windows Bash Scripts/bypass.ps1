# Check the instructions here on how to use it "irm https://bypass.rlabinc.cf | iex"

$ErrorActionPreference = "Stop"
# Enable TLSv1.2 for compatibility with older clients
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$DownloadURL = 'https://raw.githubusercontent.com/AveYo/MediaCreationTool.bat/main/bypass11/Skip_TPM_Check_on_Dynamic_Update.cmd'
$DownloadURL2 = 'https://raw.github.rlabinc.cf/AveYo/MediaCreationTool.bat/main/bypass11/Skip_TPM_Check_on_Dynamic_Update.cmd'

$rand = Get-Random -Maximum 99999999
$isAdmin = [bool]([Security.Principal.WindowsIdentity]::GetCurrent().Groups -match 'S-1-5-32-544')
$FilePath = if ($isAdmin) { "$env:SystemRoot\Temp\Skip_TPM_Check_on_Dynamic_Update_$rand.cmd" } else { "$env:TEMP\Skip_TPM_Check_on_Dynamic_Update_$rand.cmd" }

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

$FilePaths = @("$env:TEMP\Skip_TPM_Check_on_Dynamic_Update*.cmd", "$env:SystemRoot\Temp\Skip_TPM_Check_on_Dynamic_Update*.cmd")
foreach ($FilePath in $FilePaths) { Get-Item $FilePath | Remove-Item }