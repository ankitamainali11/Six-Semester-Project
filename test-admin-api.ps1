# Admin API Testing Script
Write-Host "Testing Admin API Endpoints..." -ForegroundColor Green

# Test 1: Unauthenticated request (should return 401)
Write-Host "`n1. Testing unauthenticated request..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/admin/users" -Method GET
    Write-Host "ERROR: Should have returned 401" -ForegroundColor Red
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse.StatusCode -eq 401) {
        Write-Host "✓ Correctly returned 401 Unauthorized" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Expected 401, got $($errorResponse.StatusCode)" -ForegroundColor Red
    }
}

# Test 2: Admin stats endpoint (should return 401 without token)
Write-Host "`n2. Testing admin stats endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/admin/stats" -Method GET
    Write-Host "ERROR: Should have returned 401" -ForegroundColor Red
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse.StatusCode -eq 401) {
        Write-Host "✓ Correctly returned 401 Unauthorized" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Expected 401, got $($errorResponse.StatusCode)" -ForegroundColor Red
    }
}

# Test 3: Test user creation without admin role (should be blocked in registration)
Write-Host "`n3. Testing user registration with admin role..." -ForegroundColor Yellow
$userData = @{
    name = "Test Admin"
    email = "testadmin@example.com"
    password = "password123"
    role = "admin"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $userData -ContentType "application/json"
    Write-Host "ERROR: Should have blocked admin role creation" -ForegroundColor Red
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse.StatusCode -eq 400) {
        Write-Host "✓ Correctly blocked admin role creation in registration" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Expected 400, got $($errorResponse.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`nBackend API Security Tests Completed!" -ForegroundColor Green
Write-Host "Note: To test with admin token, you need to:" -ForegroundColor Cyan
Write-Host "1. Create an admin user manually in MongoDB" -ForegroundColor Cyan
Write-Host "2. Login to get a JWT token" -ForegroundColor Cyan
Write-Host "3. Use the token in Authorization header" -ForegroundColor Cyan