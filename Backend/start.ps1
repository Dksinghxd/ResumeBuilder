# Resume Builder Backend Startup Script
Write-Host "Starting Resume Builder Backend..." -ForegroundColor Green
Write-Host "Current working directory: $(Get-Location)" -ForegroundColor Cyan

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build TypeScript
Write-Host "Building TypeScript..." -ForegroundColor Yellow
npm run build

# Start the server
Write-Host "Starting server on port 5000..." -ForegroundColor Green
node dist/index.js
