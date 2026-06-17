@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo ================================================================
echo   The Collective - demo setup (photos + seed)
echo ----------------------------------------------------------------
echo   Step 1: download ~138 real demo photos into public\demo\
echo   Step 2: seed 60 members + ~250 proofs + feedback into Supabase
echo.
echo   Target: your PRODUCTION Supabase (from .env.local)
echo   All demo rows are tagged is_demo=true and can be removed with:
echo       npm run seed:demo:reset
echo ================================================================
echo.
pause

echo.
echo [1/2] Downloading real demo photos (faces + themed proof images)...
echo       (If offline, the committed branded baselines are kept.)
call npm run demo:assets
if errorlevel 1 (
  echo.
  echo Asset step reported an error. Continuing with whatever images are present.
)

REM --- guard flags for the seed ---
set "ALLOW_DEMO_SEED=true"

REM --- generate a strong shared password for the 60 demo accounts ---
for /f %%i in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString('N').Substring(0,16)"') do set "GENPW=%%i"
set "DEMO_USER_PASSWORD=Demo-!GENPW!-26"
echo.
echo Demo account password: !DEMO_USER_PASSWORD!
echo !DEMO_USER_PASSWORD!> demo-seed-password.txt
echo (also saved to demo-seed-password.txt in this folder)

echo.
echo [2/2] Seeding demo data into Supabase...
call npm run seed:demo
if errorlevel 1 (
  echo.
  echo Seed reported an error. Check the messages above.
  echo Nothing partial to worry about: re-running is safe ^(idempotent^),
  echo and "npm run seed:demo:reset" removes only demo rows.
  pause
  exit /b 1
)

echo.
echo ================================================================
echo   Finished.
echo   - Demo password saved in: demo-seed-password.txt  (delete after saving)
echo   - To deploy the photos with the app, commit public\demo\ :
echo       git add public/demo package.json scripts run-demo-seed.cmd
echo       git commit -m "demo photos + seed setup"
echo       git push
echo   - To undo the seeded data later:  npm run seed:demo:reset
echo ================================================================
pause
