$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:8080"
$keycloakUrl = "http://localhost:8180"
$realm = "bid-realm"
$clientId = "bid-app-client"
$username = "testuser5"
$password = "password"

Write-Host "1. Registering User..."
try {
    $body = @{
        username = $username
        password = $password
        email = "test5@test.com"
        firstName = "Test"
        lastName = "User"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
    Write-Host "   User registered."
} catch {
    Write-Host "   Registration info: $($_.Exception.Message)"
}

Write-Host "2. Logging in via Keycloak..."
try {
    $tokenUri = "$keycloakUrl/realms/$realm/protocol/openid-connect/token"
    $body = @{
        client_id = $clientId
        username = $username
        password = $password
        grant_type = "password"
    }
    $tokenResponse = Invoke-RestMethod -Uri $tokenUri -Method Post -Body $body
    $token = $tokenResponse.access_token
    if (-not $token) {
        Write-Host "   Login failed. No token received."
        exit 1
    }
    $headers = @{ Authorization = "Bearer $token" }
    Write-Host "   Logged in. Token received."
} catch {
    Write-Host "   Login failed: $($_.Exception.Message)"
    # Clean up error details
    if ($_.Exception.Response) {
         $stream = $_.Exception.Response.GetResponseStream()
         $reader = New-Object System.IO.StreamReader($stream)
         $responseBody = $reader.ReadToEnd()
         Write-Host "   Error Body: $responseBody"
    }
    exit 1
}

Write-Host "3. Listing Auctions..."
try {
    $auctions = Invoke-RestMethod -Uri "$baseUrl/auctions" -Method Get -Headers $headers
} catch {
    Write-Host "   Failed to list auctions: $($_.Exception.Message)"
    exit 1
}

$auctionId = $null
if ($auctions.Count -gt 0) {
    if ($auctions[0].id) {
         $auctionId = $auctions[0].id
    } else {
         $auctionId = $auctions.id 
    }
    Write-Host "   Found existing auction ID: $auctionId"
} else {
    Write-Host "   No auctions found. Creating one..."
    # Boundary for multipart
    $boundary = [System.Guid]::NewGuid().ToString() 
    $LF = "`r`n"
    
    $bodyLines = @()
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"title`""
    $bodyLines += ""
    $bodyLines += "Test Auction"
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"description`""
    $bodyLines += ""
    $bodyLines += "Test Description"
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"startPrice`""
    $bodyLines += ""
    $bodyLines += "100.0"
    $bodyLines += "--$boundary--"
    
    $body = $bodyLines -join $LF
    
    try {
        $newAuction = Invoke-RestMethod -Uri "$baseUrl/auctions" -Method Post -Body $body -ContentType "multipart/form-data; boundary=$boundary" -Headers $headers
        $auctionId = $newAuction.id
        Write-Host "   Created new auction ID: $auctionId"
    } catch {
        Write-Host "   Failed to create auction: $($_.Exception.Message)"
        if ($_.Exception.Response) {
             $stream = $_.Exception.Response.GetResponseStream()
             $reader = New-Object System.IO.StreamReader($stream)
             $responseBody = $reader.ReadToEnd()
             Write-Host "   Error Body: $responseBody"
        }
        exit 1
    }
}

Write-Host "4. Placing Bid..."
$bidAmount = 150.0
try {
    $bid = Invoke-RestMethod -Uri "$baseUrl/bids?auctionId=$auctionId&amount=$bidAmount" -Method Post -Headers $headers
    Write-Host "   Bid placed. ID: $($bid.id)"
} catch {
    Write-Host "   Failed to place bid: $($_.Exception.Message)"
    if ($_.Exception.Response) {
         $stream = $_.Exception.Response.GetResponseStream()
         $reader = New-Object System.IO.StreamReader($stream)
         $responseBody = $reader.ReadToEnd()
         Write-Host "   Error Body: $responseBody"
    }
}

Write-Host "5. Verifying Bid History..."
try {
    $history = Invoke-RestMethod -Uri "$baseUrl/bids/auction/$auctionId" -Method Get -Headers $headers
    Write-Host "   Bid History Results: "
    $history | Format-Table id, amount, userId
    
    $found = $history | Where-Object { $_.amount -eq $bidAmount }
    if ($found) {
        Write-Host "SUCCESS: Bid verification passed!"
    } else {
        Write-Host "FAILURE: Bid verification failed. Bid not found in history."
    }
} catch {
    Write-Host "   Failed to get bid history: $($_.Exception.Message)"
    if ($_.Exception.Response) {
         $stream = $_.Exception.Response.GetResponseStream()
         $reader = New-Object System.IO.StreamReader($stream)
         $responseBody = $reader.ReadToEnd()
         Write-Host "   Error Body: $responseBody"
    }
}
