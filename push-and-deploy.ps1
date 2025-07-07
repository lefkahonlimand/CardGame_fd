# Card Estimation Game - Push und Deploy Script
# Dieses Script committet lokale Änderungen, pusht sie zu GitHub und deployt sie auf den Jetson

Write-Host "=== CARD ESTIMATION GAME - PUSH & DEPLOY ===" -ForegroundColor Cyan
Write-Host "Datum: $(Get-Date)" -ForegroundColor White
Write-Host ""

# Prüfen ob wir im richtigen Verzeichnis sind
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Fehler: package.json nicht gefunden" -ForegroundColor Red
    Write-Host "Stellen Sie sicher, dass Sie im Projekt-Root-Verzeichnis sind" -ForegroundColor Yellow
    exit 1
}

Write-Host "=== 1. GIT STATUS PRÜFEN ===" -ForegroundColor Yellow

# Git Status anzeigen
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📋 Folgende Dateien haben Änderungen:" -ForegroundColor Blue
    git status --short
    Write-Host ""
} else {
    Write-Host "✅ Keine lokalen Änderungen gefunden" -ForegroundColor Green
    $continue = Read-Host "Trotzdem Deployment auf Jetson durchführen? (j/N)"
    if ($continue -ne "j" -and $continue -ne "J") {
        Write-Host "Deployment abgebrochen" -ForegroundColor Yellow
        exit 0
    }
}

# Commit-Nachricht abfragen wenn Änderungen vorhanden
if ($gitStatus) {
    Write-Host "=== 2. COMMIT ERSTELLEN ===" -ForegroundColor Yellow
    
    $commitMessage = Read-Host "Commit-Nachricht eingeben"
    if (-not $commitMessage) {
        $commitMessage = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        Write-Host "Standard-Commit-Nachricht verwendet: $commitMessage" -ForegroundColor Gray
    }
    
    # Git Add und Commit
    Write-Host "Füge Dateien hinzu..." -ForegroundColor White
    git add .
    
    Write-Host "Erstelle Commit..." -ForegroundColor White
    git commit -m "$commitMessage"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Commit erfolgreich erstellt" -ForegroundColor Green
    } else {
        Write-Host "❌ Commit fehlgeschlagen" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Push zu GitHub
if ($gitStatus) {
    Write-Host "=== 3. PUSH ZU GITHUB ===" -ForegroundColor Yellow
    
    Write-Host "Pushe zu GitHub..." -ForegroundColor White
    git push origin main 2>$null
    if ($LASTEXITCODE -ne 0) {
        git push origin master 2>$null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Push zu GitHub erfolgreich" -ForegroundColor Green
    } else {
        Write-Host "❌ Push zu GitHub fehlgeschlagen" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Deployment auf Jetson
Write-Host "=== 4. DEPLOYMENT AUF JETSON ===" -ForegroundColor Yellow

# Prüfen ob Jetson erreichbar ist
Write-Host "Prüfe Jetson-Verbindung..." -ForegroundColor White
$testConnection = ssh -o ConnectTimeout=5 jetson-nano "echo 'OK'" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Jetson nicht erreichbar" -ForegroundColor Red
    Write-Host "Prüfen Sie:" -ForegroundColor Yellow
    Write-Host "  • Ist der Jetson eingeschaltet?" -ForegroundColor Gray
    Write-Host "  • SSH-Verbindung konfiguriert?" -ForegroundColor Gray
    Write-Host "  • Netzwerkverbindung?" -ForegroundColor Gray
    exit 1
}
Write-Host "✅ Jetson ist erreichbar" -ForegroundColor Green

# Deployment-Script übertragen
Write-Host "Übertrage Deployment-Script..." -ForegroundColor White
scp deploy-to-jetson.sh jetson-nano:~/

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Script übertragen" -ForegroundColor Green
} else {
    Write-Host "❌ Script-Übertragung fehlgeschlagen" -ForegroundColor Red
    exit 1
}

# Deployment ausführen
Write-Host ""
Write-Host "🚀 Führe Deployment auf Jetson aus..." -ForegroundColor Cyan
Write-Host "Dies kann einige Minuten dauern..." -ForegroundColor Gray
Write-Host ""

ssh jetson-nano "chmod +x deploy-to-jetson.sh && dos2unix deploy-to-jetson.sh && ./deploy-to-jetson.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 DEPLOYMENT ERFOLGREICH ABGESCHLOSSEN!" -ForegroundColor Green -BackgroundColor Black
    Write-Host ""
    Write-Host "Nächste Schritte:" -ForegroundColor Cyan
    Write-Host "  • Testen Sie die Anwendung über die ngrok URL" -ForegroundColor White
    Write-Host "  • Überwachen Sie die Logs bei Bedarf" -ForegroundColor White
    Write-Host ""
    
    # Ngrok URL anzeigen
    Write-Host "Hole aktuelle ngrok URL..." -ForegroundColor White
    $ngrokUrl = ssh jetson-nano "curl -s http://localhost:4040/api/tunnels | python3 -c 'import sys,json; data=json.load(sys.stdin); print(data[\"tunnels\"][0][\"public_url\"] if data[\"tunnels\"] else \"Keine URL\")' 2>/dev/null || echo 'URL-Abruf fehlgeschlagen'"
    
    if ($ngrokUrl -and $ngrokUrl -ne "Keine URL" -and $ngrokUrl -ne "URL-Abruf fehlgeschlagen") {
        Write-Host "🌐 Öffentliche URL: $ngrokUrl" -ForegroundColor Blue -BackgroundColor Black
    }
    
} else {
    Write-Host ""
    Write-Host "❌ DEPLOYMENT FEHLGESCHLAGEN" -ForegroundColor Red -BackgroundColor Black
    Write-Host "Prüfen Sie die Logs auf dem Jetson für Details" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Script beendet um $(Get-Date)" -ForegroundColor Gray
