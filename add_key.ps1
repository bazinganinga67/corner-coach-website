$token = "YOUR_GITHUB_TOKEN"
$pubkey = Get-Content "C:\Users\yuvin\.ssh\id_ed25519.pub"
$body = @{
  title = "corner-coach-website"
  key = $pubkey
} | ConvertTo-Json
try {
  $r = Invoke-RestMethod -Uri "https://api.github.com/user/keys" -Method Post -Headers @{Authorization = "Bearer $token"} -Body $body -ContentType "application/json"
  Write-Host "SSH key added successfully! ID: $($r.id)"
} catch {
  Write-Host "Failed: $_"
  $_.Exception.Response.StatusCode.value__
}
