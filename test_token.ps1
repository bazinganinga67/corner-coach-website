$token = "YOUR_GITHUB_TOKEN"
try {
  $r = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers @{Authorization = "Bearer $token"}
  Write-Host "Authed as: $($r.login)"
} catch {
  Write-Host "Token invalid: $_"
}
