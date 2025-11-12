param(
    [Parameter(Mandatory = $true)]
    [string]$VercelToken,

    [Parameter(Mandatory = $true)]
    [string]$ProjectName,

    [string]$TeamSlug = $null,

    [string]$Environment = 'production'
)

function Write-Info($message) {
    Write-Host $message -ForegroundColor Cyan
}

function Write-Warn($message) {
    Write-Host $message -ForegroundColor Yellow
}

function Write-ErrorMessage($message) {
    Write-Host $message -ForegroundColor Red
}

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Warn 'The Vercel CLI is not installed. Install it with: npm install -g vercel'
}

$baseUri = 'https://api.vercel.com'

function Invoke-VercelApi {
    param(
        [ValidateSet('GET','POST','PATCH','DELETE')] [string]$Method,
        [string]$Path,
        [hashtable]$Body = $null
    )

    $uri = "$baseUri$Path"
    if ($TeamSlug) {
        $uri += ($uri.Contains('?') ? '&' : '?') + "teamId=$TeamSlug"
    }

    $headers = @{ Authorization = "Bearer $VercelToken" }

    if ($Body) {
        $json = $Body | ConvertTo-Json -Depth 5
        return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ContentType 'application/json' -Body $json
    }

    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
}

Write-Info "→ Looking up Vercel project '$ProjectName'"
$project = Invoke-VercelApi -Method 'GET' -Path "/v9/projects/$ProjectName"
if (-not $project) {
    Write-ErrorMessage "Unable to find project '$ProjectName'. Verify the project name and team slug."
    exit 1
}

$projectId = $project.id
Write-Info "✓ Project found (id: $projectId)"

$requiredEnv = @(
    @{ Name = 'POSTGRES_URL'; Secret = $true },
    @{ Name = 'POSTGRES_USER'; Secret = $true },
    @{ Name = 'POSTGRES_HOST'; Secret = $true },
    @{ Name = 'POSTGRES_PASSWORD'; Secret = $true },
    @{ Name = 'POSTGRES_DATABASE'; Secret = $true },
    @{ Name = 'POSTGRES_PRISMA_URL'; Secret = $true },
    @{ Name = 'POSTGRES_URL_NON_POOLING'; Secret = $true },
    @{ Name = 'SUPABASE_URL'; Secret = $true },
    @{ Name = 'SUPABASE_ANON_KEY'; Secret = $true },
    @{ Name = 'SUPABASE_SERVICE_ROLE_KEY'; Secret = $true },
    @{ Name = 'SUPABASE_JWT_SECRET'; Secret = $true },
    @{ Name = 'NEXT_PUBLIC_SUPABASE_URL'; Secret = $false },
    @{ Name = 'NEXT_PUBLIC_SUPABASE_ANON_KEY'; Secret = $false },
    @{ Name = 'ASSEMBLYAI_API_KEY'; Secret = $true },
    @{ Name = 'GROQ_API_KEY'; Secret = $true },
    @{ Name = 'RESEND_API_KEY'; Secret = $true },
    @{ Name = 'NOTIFICATION_CRON_SCHEDULE'; Secret = $false },
    @{ Name = 'MORNING_NOTIFICATION_TIME'; Secret = $false },
    @{ Name = 'AI_NOTIFICATION_THRESHOLD'; Secret = $false },
    @{ Name = 'CRON_SECRET'; Secret = $true }
)

Write-Info "→ Fetching current $Environment environment variables from Vercel"
$existingEnv = Invoke-VercelApi -Method 'GET' -Path "/v9/projects/$projectId/env?target=$Environment"
$existingLookup = @{}
foreach ($envVar in $existingEnv.envs) {
    $existingLookup[$envVar.key] = $envVar
}

$failures = @()
foreach ($var in $requiredEnv) {
    $name = $var.Name
    $localValue = [Environment]::GetEnvironmentVariable($name, 'Process')
    if (-not $localValue) {
        $failures += $name
        Write-Warn "⚠️  Local value for $name not found. Set it as an environment variable before running the script."
        continue
    }

    $isSecret = $var.Secret
    $type = $isSecret ? 'encrypted' : 'plain'

    if ($existingLookup.ContainsKey($name)) {
        Write-Info "• $name already exists in Vercel ($Environment). Skipping."
        continue
    }

    Write-Info "→ Adding $name to Vercel ($Environment)"
    try {
        Invoke-VercelApi -Method 'POST' -Path "/v9/projects/$projectId/env" -Body @{
            key = $name
            value = $localValue
            target = @($Environment)
            type = $type
        }
        Write-Info "  ✓ Added $name"
    } catch {
        Write-ErrorMessage "  ✗ Failed to add $name : $($_.Exception.Message)"
    }
}

if ($failures.Count -gt 0) {
    Write-Warn "The following variables were not uploaded because local values were missing:"
    $failures | ForEach-Object { Write-Warn "  - $_" }
    Write-Warn 'Populate them locally and re-run the script to upload.'
}

Write-Info 'Done. Remember to redeploy your project so the updated environment variables take effect.'







