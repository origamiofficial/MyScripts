@echo off
title Windows Health Restore v6

net session>nul 2>&1
if %errorlevel%==0 goto main
echo CreateObject("Shell.Application").ShellExecute "%~f0", "", "", "runas">"%temp%/elevate.vbs"
"%temp%/elevate.vbs"
del "%temp%/elevate.vbs"
exit

:main
set KB_UPDATES=5063878 5062660

echo ******************************************************************
echo ***                                                            ***
echo ***         W I N D O W S   H E A L T H   R E S T O R E        ***
echo ***                                       by R Lab inc.        ***
echo ***                                                            ***
echo ******************************************************************
echo.
echo.
echo "##### Step 01/12: Checking and Blocking Forbidden Updates #####"
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
echo "##### Step 02/12: Checking System Files #####"
sfc /scannow
echo.
echo "##### Step 03/12: Checking System Image Health #####"
dism /Online /Cleanup-Image /CheckHealth
echo.
echo "##### Step 04/12: Scanning System Image Health #####"
dism /Online /Cleanup-Image /ScanHealth
echo.
echo "##### Step 05/12: Restoring System Image Health #####"
dism /Online /Cleanup-Image /RestoreHealth
echo.
echo "##### Step 06/12: Analyzing Component Store #####"
dism /online /cleanup-image /analyzecomponentstore
echo.
echo "##### Step 07/12: Clearing DNS Cache #####"
ipconfig /flushdns
echo.
echo "##### Step 08/12: Disabling Processor Idle Disable #####"
PowerCfg /SETACVALUEINDEX SCHEME_CURRENT SUB_PROCESSOR IDLEDISABLE 000
echo.
echo "##### Step 09/12: Activating Current Power Plan #####"
PowerCfg /SETACTIVE SCHEME_CURRENT
echo.
echo "##### Step 10/12: Deleting Minidump Files #####"
del /f /s /q %systemroot%\minidump\*.*
echo.
echo "##### Step 11/12: Deleting Dump Files #####"
del *.dmp /s
echo.
echo "##### Step 12/12: Restarting Your Computer #####"
echo "##### We're done now, run again within a month #####"
pause
shutdown /r /t 0
exit

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