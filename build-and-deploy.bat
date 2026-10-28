@echo off
echo ============================================
echo  CampusBridge - Build and Deploy Script
echo ============================================

echo.
echo [1/4] Cleaning old client build...
if exist "client\dist" rmdir /s /q "client\dist"
echo      Done.

echo.
echo [2/4] Building client (Vite production build)...
cd client
call npm run build
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Client build failed! Aborting.
  cd ..
  exit /b 1
)
cd ..
echo      Done.

echo.
echo [3/4] Staging all changes for git commit...
git add -A
echo      Done.

echo.
echo [4/4] Committing and pushing to GitHub (triggers Render redeploy)...
set /p MSG="Enter commit message (or press Enter for default): "
if "%MSG%"=="" set MSG=deploy: rebuild client + server updates
git commit -m "%MSG%"
git push

echo.
echo ============================================
echo  Deploy complete! Render will auto-deploy.
echo  Watch: https://dashboard.render.com
echo ============================================
