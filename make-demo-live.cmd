@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo ================================================================
echo   The Collective - MAKE DEMO LIVE
echo ----------------------------------------------------------------
echo   1) download real demo photos      (public\demo\)
echo   2) seed demo data into Supabase   (production)
echo   3) commit + push to GitHub        (triggers deploy)
echo ================================================================
echo.
echo Target DB : production Supabase (from .env.local)
echo Target git: origin/main (https://github.com/xhan145/thecollective)
echo Undo seed : npm run seed:demo:reset
echo.
pause

echo.
echo [1/3] Downloading real demo photos (faces + themed proof images)...
call npm run demo:assets
if errorlevel 1 echo   (asset step had an issue; keeping committed baselines)

REM --- guard flags + demo account password ---
set "ALLOW_DEMO_SEED=true"
for /f %%i in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString('N').Substring(0,16)"') do set "GENPW=%%i"
set "DEMO_USER_PASSWORD=Demo-!GENPW!-26"
echo.
echo Demo account password: !DEMO_USER_PASSWORD!
echo !DEMO_USER_PASSWORD!> demo-seed-password.txt
echo (saved to demo-seed-password.txt - git-ignored - delete after saving)

echo.
echo [2/3] Seeding demo data into Supabase...
call npm run seed:demo
if errorlevel 1 (
  echo.
  echo Seed failed - see messages above. Re-running is safe ^(idempotent^).
  echo Skipping git push so you can fix the seed first.
  pause
  exit /b 1
)

echo.
echo [3/3] Committing and pushing to GitHub...
if "%~1"=="" goto :haveid
:haveid
for /f "delims=" %%n in ('git config user.name') do set "GITNAME=%%n"
if "!GITNAME!"=="" git config user.name "xhan145"
for /f "delims=" %%e in ('git config user.email') do set "GITMAIL=%%e"
if "!GITMAIL!"=="" git config user.email "xhan145@gmail.com"

git add -A
git commit -m "Demo population: photo assets + seed scripts + runner"
if errorlevel 1 echo   (nothing new to commit, continuing)
git push origin main
if errorlevel 1 (
  echo.
  echo PUSH FAILED. You may need to sign in to GitHub. The commit is saved
  echo locally - just run:  git push origin main
  pause
  exit /b 1
)

echo.
echo ================================================================
echo   DONE. Pushed to origin/main - your deploy should update shortly.
echo   - Demo data is live in Supabase.
echo   - Delete demo-seed-password.txt after saving the password.
echo   - Undo seed any time:  npm run seed:demo:reset
echo ================================================================
pause
