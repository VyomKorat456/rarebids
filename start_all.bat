@echo off
echo Starting Bidding System Infrastructure...
docker-compose up -d

echo Waiting for infrastructure to stabilize...
timeout /t 10 /nobreak

echo Starting Eureka Server...
cd eureka-server
start "Eureka Server" /MIN cmd /c "mvnw.cmd spring-boot:run"
cd ..
timeout /t 15 /nobreak

echo Starting Dependencies...
cd api-gateway
start "API Gateway" /MIN cmd /c "mvnw.cmd spring-boot:run"
cd ..

cd auth-service
start "Auth Service" /MIN cmd /c "mvnw.cmd spring-boot:run"
cd ..

echo Waiting for Auth and Gateway...
timeout /t 20 /nobreak

echo Starting Core Services...
cd auction-service
start "Auction Service" /MIN cmd /c "mvnw.cmd spring-boot:run"
cd ..

cd auction-service
start "Auction Service" /MIN cmd /c "mvnw.cmd spring-boot:run"
cd ..

cd auction-service
start "Auction Service" /MIN cmd /c "mvnw.cmd spring-boot:run"
cd ..

cd notification-service
start "Notification Service" /MIN cmd /c "mvnw.cmd spring-boot:run"
cd ..


echo Starting Frontend...
cd frontend
start "Frontend" /MIN cmd /c "npm run dev"
cd ..

echo All services attempt to start. Check individual windows for logs.
pause
