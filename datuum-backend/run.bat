@echo off
REM Run Spring Boot Application
cd /d "%~dp0"
call mvnw.cmd spring-boot:run

