@echo off
set "PATH=C:\Users\GOVINDARAJ\AppData\Local\Programs\MinGit\cmd;C:\Users\GOVINDARAJ\AppData\Local\Programs\MinGit\mingw64\bin;%PATH%"
cd /d "C:\Users\GOVINDARAJ\OneDrive\Desktop\Smart_Attendance"
echo ============================================================
echo Pushing Smart Attendance to GitHub:
echo https://github.com/govindrajvelmass-cpu/Smart-Attendance.git
echo ============================================================
echo.
git push -u origin main
echo.
echo ============================================================
echo If successful, your repository is now updated on GitHub!
echo ============================================================
pause
