@echo off
start "API Gateway" /MIN cmd /c "mvnw.cmd -pl api-gateway spring-boot:run"
start "Admin Service" /MIN cmd /c "mvnw.cmd -pl admin-service spring-boot:run"
start "WebSocket Service" /MIN cmd /c "mvnw.cmd -pl websocket-service spring-boot:run"
echo Services started.
