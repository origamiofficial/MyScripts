@echo off  
title Windows Health Restore v5

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
echo ******************************************************************
echo.
echo.
echo "##### Step 01/11: Checking System Files #####"
sfc /scannow
echo "##### Step 02/11: Checking System Image Health #####"
dism /Online /Cleanup-Image /CheckHealth
echo "##### Step 03/11: Scanning System Image Health #####"
dism /Online /Cleanup-Image /ScanHealth
echo "##### Step 04/11: Restoring System Image Health #####"
dism /Online /Cleanup-Image /RestoreHealth
echo "##### Step 05/11: Analyzing Component Store #####"
dism /online /cleanup-image /analyzecomponentstore
echo "##### Step 06/11: Clearing DNS Cache #####"
ipconfig /flushdns
echo "##### Step 07/11: Disabling Processor Idle Disable #####"
PowerCfg /SETACVALUEINDEX SCHEME_CURRENT SUB_PROCESSOR IDLEDISABLE 000
echo "##### Step 08/11: Activating Current Power Plan #####"
PowerCfg /SETACTIVE SCHEME_CURRENT
echo "##### Step 09/11: Deleting Minidump Files #####"
del /f /s /q %systemroot%\minidump\*.*
echo "##### Step 10/11: Deleting Dump Files #####"
del *.dmp /s
echo "##### Step 11/11: Restarting Your Computer #####"
echo "##### We're done now, run again within a month #####"
pause
shutdown /r /t 0
exit
