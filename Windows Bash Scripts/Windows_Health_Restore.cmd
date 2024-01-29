@echo off  
title Windows Health Restore V4

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
echo "##### Step 1: Scanning Now #####"
SFC /scannow
echo "##### Step 2: Checking Health #####"
DISM /Online /Cleanup-Image /CheckHealth
echo "##### Step 3: Scanning Health #####"
DISM /Online /Cleanup-Image /ScanHealth
echo "##### Step 4: Restoring Health #####"
DISM /Online /Cleanup-Image /RestoreHealth
echo "##### We're done now, run again within a month #####"
echo "##### Your computer will RESTART now #####"
PAUSE
shutdown /r /t 0
exit