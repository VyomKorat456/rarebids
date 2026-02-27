@echo off
echo Stopping Bidding System...

taskkill /FI "WINDOWTITLE eq Eureka Server" /F
taskkill /FI "WINDOWTITLE eq API Gateway" /F
taskkill /FI "WINDOWTITLE eq Auth Service" /F
taskkill /FI "WINDOWTITLE eq Auction Service" /F
taskkill /FI "WINDOWTITLE eq Auction Service" /F
taskkill /FI "WINDOWTITLE eq Auction Service" /F
taskkill /FI "WINDOWTITLE eq Notification Service" /F

taskkill /FI "WINDOWTITLE eq Frontend" /F

echo Stopping Infrastructure...
docker-compose down

echo All services stopped.
pause
