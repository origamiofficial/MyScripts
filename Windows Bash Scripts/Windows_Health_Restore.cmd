@echo off
title Windows Health Restore v6

net session>nul 2>&1
if %errorlevel%==0 goto main
echo CreateObject("Shell.Application").ShellExecute "%~f0", "", "", "runas">"%temp%/elevate.vbs"
"%temp%/elevate.vbs"
del "%temp%/elevate.vbs"
exit

:main
echo ******************************************************************
echo ***                                                            ***
echo ***         W I N D O W S   H E A L T H   R E S T O R E        ***
echo ***                                       by R Lab inc.        ***
echo ***                                                            ***
echo ******************************************************************
echo.
echo.
echo "##### Extra Step: Checking SSD Breaking Updates #####"
call :CheckAndUninstallKB 5063878
call :CheckAndUninstallKB 5062660
echo Hiding SSD Breaking Updates to Prevent Reinstall
powershell -NoProfile -ExecutionPolicy Bypass -Command "Try { $ids=@('5063878','5062660'); $session = New-Object -ComObject Microsoft.Update.Session; $searcher = $session.CreateUpdateSearcher(); $searchResult = $searcher.Search('IsInstalled=0 and Type=\"Software\"'); $hiddenCount = 0; foreach ($update in $searchResult.Updates) { if ($update.KBArticleIDs -and ($update.KBArticleIDs | Where-Object { $ids -contains $_ })) { $update.IsHidden = $true; $hiddenCount++ } }; if ($hiddenCount -gt 0) { Write-Host ('SUCCESS: ' + $hiddenCount + ' updates were hidden.') } else { Write-Host 'INFO: No target updates were found to hide (may already be hidden).' } } Catch { Write-Host 'INFO: Updates are already hidden or not available.' }"
echo.
echo "##### Step 01/11: Checking System Files #####"
sfc /scannow
echo.
echo "##### Step 02/11: Checking System Image Health #####"
dism /Online /Cleanup-Image /CheckHealth
echo.
echo "##### Step 03/11: Scanning System Image Health #####"
dism /Online /Cleanup-Image /ScanHealth
echo.
echo "##### Step 04/11: Restoring System Image Health #####"
dism /Online /Cleanup-Image /RestoreHealth
echo.
echo "##### Step 05/11: Analyzing Component Store #####"
dism /online /cleanup-image /analyzecomponentstore
echo.
echo "##### Step 06/11: Clearing DNS Cache #####"
ipconfig /flushdns
echo.
echo "##### Step 07/11: Disabling Processor Idle Disable #####"
PowerCfg /SETACVALUEINDEX SCHEME_CURRENT SUB_PROCESSOR IDLEDISABLE 000
echo.
echo "##### Step 08/11: Activating Current Power Plan #####"
PowerCfg /SETACTIVE SCHEME_CURRENT
echo.
echo "##### Step 09/11: Deleting Minidump Files #####"
del /f /s /q %systemroot%\minidump\*.*
echo.
echo "##### Step 10/11: Deleting Dump Files #####"
del *.dmp /s
echo.
echo "##### Step 11/11: Restarting Your Computer #####"
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
    wusa /uninstall /kb:%kb% /norestart
    if %errorlevel% neq 0 (
        echo INFO: Failed to uninstall KB%kb%. Please uninstall manually.
    )
) else (
    echo INFO: KB%kb% is not installed.
)
exit /b