# 🔐 Card Estimation Game - Sichere Wartungsanleitung

## 🛡️ **Sicherheitshinweis**
Diese Anleitung verwendet Platzhalter für sensible Daten. 
**Echte Zugangsdaten befinden sich in:** `.env.local.secure` (nur lokal)

---

## 📋 **Management-Tools mit Platzhaltern**

### 🎯 **Hauptsteuerung**

```bash
# SSH-Verbindung (Platzhalter verwenden)
ssh {{JETSON_HOST}}

# Status-Check
ssh {{JETSON_HOST}} "cd {{PROJECT_PATH}} && ./jetson-control.sh status"

# Services neu starten
ssh {{JETSON_HOST}} "cd {{PROJECT_PATH}} && echo '{{SUDO_PASSWORD}}' | sudo -S systemctl restart card-game ngrok"
```

### 📊 **Quick Commands (für Copy-Paste)**

**Vor Nutzung:** Werte aus `.env.local.secure` einfügen!

```bash
# 1. SSH-Verbindung
ssh {{JETSON_HOST}}

# 2. Status-Check  
ssh {{JETSON_HOST}} "cd {{PROJECT_PATH}} && ./jetson-control.sh status"

# 3. URL abrufen
ssh {{JETSON_HOST}} "cd {{PROJECT_PATH}} && ./jetson-control.sh url"

# 4. Live-Monitoring
ssh {{JETSON_HOST}} "cd {{PROJECT_PATH}} && ./monitor-jetson.sh"

# 5. Services neu starten (bei Problemen)
ssh {{JETSON_HOST}} "cd {{PROJECT_PATH}} && echo '{{SUDO_PASSWORD}}' | sudo -S systemctl restart card-game ngrok"

# 6. Deployment
ssh {{JETSON_HOST}} "cd {{PROJECT_PATH}} && ./deploy-to-jetson.sh"
```

---

## 🔧 **Lokale Secure-Datei verwenden**

### 📝 **Anleitung:**

1. **Secure-Datei öffnen:**
   ```powershell
   notepad .env.local.secure
   ```

2. **Werte kopieren und in Befehle einfügen:**
   - `{{JETSON_HOST}}` → Ersetzen mit Wert aus `JETSON_HOST`
   - `{{PROJECT_PATH}}` → Ersetzen mit Wert aus `PROJECT_PATH`  
   - `{{SUDO_PASSWORD}}` → Ersetzen mit Wert aus `SUDO_PASSWORD`

3. **Befehl ausführen**

### 🤖 **Für AI-Agent Sessions:**

**Bei jeder neuen Session angeben:**
```
"Jetson SSH: jetson-nano"
"Projekt-Pfad: /home/fd1337/card-estimation-game"  
"Sudo-Passwort verwenden aus lokaler .env.local.secure"
```

---

## 🛡️ **Sicherheitsvorteile**

✅ **Cloud-Dokumentation bleibt sicher** (keine sensiblen Daten)
✅ **Lokale Daten bleiben lokal** (nicht in Git/Cloud)
✅ **Funktionalität bleibt erhalten** (einfacher Copy-Paste)
✅ **AI-Agent kann weiterhin helfen** (mit bereitgestellten Werten)

---

## 🔐 **Zusätzliche Sicherheitsoptionen**

### **Windows BitLocker (Empfohlen):**
- Verschlüsselt gesamte Festplatte
- `.env.local.secure` automatisch geschützt

### **7-Zip Verschlüsselung:**
```powershell
# Secure-Ordner verschlüsselt archivieren
7z a -p{{MASTER_PASSWORD}} secure.7z .env.local.secure
```

### **PowerShell Secure String:**
```powershell
# Passwort als SecureString speichern
$SecurePassword = Read-Host "Password" -AsSecureString
$SecurePassword | ConvertFrom-SecureString | Out-File "secure-password.txt"
```

---

**🎯 Optimale Balance zwischen Sicherheit und Usability!**
