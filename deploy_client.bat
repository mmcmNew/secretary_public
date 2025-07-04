@echo off
echo Building client...
cd client
call npm run build

echo Copying dist to server...
if exist "..\server\app\dist" rmdir /s /q "..\server\app\dist"
xcopy /e /i /y "dist" "..\server\app\dist"

echo Client deployed successfully!
pause