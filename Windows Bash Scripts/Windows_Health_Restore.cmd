@echo off
title Windows Health Restore v7

if "%~1"=="RunTasks" goto RunTasks

net session>nul 2>&1
if %errorlevel%==0 goto premain
echo CreateObject("Shell.Application").ShellExecute "%~f0", "", "", "runas">"%temp%/elevate.vbs"
"%temp%/elevate.vbs"
del "%temp%/elevate.vbs"
exit

:premain
set "LOGDIR=C:\Windows Health Restore"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"

for /f "usebackq" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'dd-MM-yyyy_HH-mm-ss'"`) do set LOGDATE=%%i
set "LOGFILE=%LOGDIR%\Log-%LOGDATE%.txt"

echo Starting Windows Health Restore...
echo Logging all system activity directly to: %LOGFILE%
echo.

powershell -NoProfile -Command "$script='%~f0'; Start-Transcript -Path '%LOGFILE%' -Force | Out-Null; & cmd.exe /c \"`\"$script`\" RunTasks\"; Stop-Transcript | Out-Null; (Get-Content '%LOGFILE%') | Where-Object { $_ -notmatch '\[=*\s*[0-9.]+' -and $_ -notmatch 'V e r i f i c a t i o n' -and $_ -notmatch 'Verification.*[0-9]' } | Set-Content '%LOGFILE%'"

echo.
echo "##### Step 15/15: Restarting Your Computer #####"
echo "##### We're done now, run again within a month #####"
pause
shutdown /r /t 0
exit

:RunTasks
set KB_UPDATES=5063878 5062660

echo ******************************************************************
echo ***                                                            ***
echo ***         W I N D O W S   H E A L T H   R E S T O R E        ***
echo ***                                       by R Lab inc.        ***
echo ***                                                            ***
echo ******************************************************************
echo.
echo.
echo "##### Step 01/15: Checking and Blocking Forbidden Updates #####"
for %%k in (%KB_UPDATES%) do (
    call :CheckAndUninstallKB %%k
)
echo "##### Preparing for PSWindowsUpdate module installation #####"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-PSRepository -Name 'PSGallery' -InstallationPolicy Trusted"
echo "##### Installing PSWindowsUpdate module if not present #####"
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (!(Get-Module -ListAvailable -Name PSWindowsUpdate)) { Install-Module PSWindowsUpdate -Force -SkipPublisherCheck }"
for %%k in (%KB_UPDATES%) do (
    echo Hiding KB%%k...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Import-Module PSWindowsUpdate; Get-WindowsUpdate -KBArticleID KB%%k | Hide-WindowsUpdate"
)
echo.
echo "##### Step 02/15: Checking System Files #####"
sfc /scannow
echo.
echo "##### Step 03/15: Checking System Image Health #####"
dism /Online /Cleanup-Image /CheckHealth
echo.
echo "##### Step 04/15: Scanning System Image Health #####"
dism /Online /Cleanup-Image /ScanHealth
echo.
echo "##### Step 05/15: Restoring System Image Health #####"
dism /Online /Cleanup-Image /RestoreHealth
echo.
echo "##### Step 06/15: Analyzing Component Store #####"
dism /online /cleanup-image /analyzecomponentstore
echo.
echo "##### Step 07/15: Cleaning Up Component Store #####"
Dism.exe /Online /Cleanup-Image /StartComponentCleanup
echo.
echo "##### Step 08/15: Resetting Component Store Base #####"
Dism.exe /Online /Cleanup-Image /StartComponentCleanup /ResetBase
echo.
echo "##### Step 09/15: Clearing DNS Cache #####"
ipconfig /flushdns
echo.
echo "##### Step 10/15: Disabling Processor Idle Disable #####"
PowerCfg /SETACVALUEINDEX SCHEME_CURRENT SUB_PROCESSOR IDLEDISABLE 000
echo.
echo "##### Step 11/15: Activating Current Power Plan #####"
PowerCfg /SETACTIVE SCHEME_CURRENT
echo.
echo "##### Step 12/15: Deleting Minidump Files #####"
del /f /s /q %systemroot%\minidump\*.*
echo.
echo "##### Step 13/15: Deleting Dump Files #####"
del *.dmp /s
echo.
echo "##### Step 14/15: Checking Windows Experience Index #####"
powershell -NoProfile -Command "Get-CimInstance Win32_WinSAT"
echo.
exit /b

:CheckAndUninstallKB
set kb=%1
echo Checking for KB%kb% installation...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$session=New-Object -ComObject Microsoft.Update.Session; $searcher=$session.CreateUpdateSearcher(); $result=$searcher.Search(\"IsInstalled=1 and Type='Software'\"); $match=$result.Updates | Where-Object { $_.KBArticleIDs -contains '%kb%' }; if ($match) { exit 1 } else { exit 0 }"

if %errorlevel% equ 1 (
    echo INFO: KB%kb% is installed. Attempting to uninstall...
	echo PLEASE CLICK UNINSTALL...
    wusa /uninstall /kb:%kb% /norestart
    if %errorlevel% neq 0 (
        echo INFO: Failed to uninstall KB%kb%. Please uninstall manually.
    )
) else (
    echo INFO: KB%kb% is not installed.
)
exit /b
