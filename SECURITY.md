# Security Guidelines

## 🔒 Security Best Practices

### Environment Variables
- Never commit `.env` files to the repository
- Use `.env.example` as a template
- Keep sensitive data in environment variables only

### Ngrok Token Management
1. Get your token from https://dashboard.ngrok.com/get-started/your-authtoken
2. Set it via environment variable:
   ```bash
   export NGROK_AUTHTOKEN=your_token_here
   ngrok config add-authtoken $NGROK_AUTHTOKEN
   ```

### Network Security
- The game server runs on localhost by default
- Ngrok provides HTTPS encryption for internet access
- No direct port forwarding required
- All external connections go through Ngrok's secure tunnel

### Data Privacy
- No user authentication required
- No personal data stored
- Game state is temporary (lost on server restart)
- No logs contain sensitive information

### Deployment Security
- Run server with non-root user on Jetson Nano
- Keep system packages updated
- Use firewall to restrict access to necessary ports only
- Monitor server logs for unusual activity

### Recommended Firewall Rules (UFW)
```bash
# Allow only necessary ports
sudo ufw allow 3000/tcp  # Game server
sudo ufw allow 4040/tcp  # Ngrok web interface (optional)
sudo ufw enable
```

### Security Checklist
- [ ] `.env` file is in `.gitignore`
- [ ] Ngrok token set via environment variable
- [ ] Server runs with limited user permissions
- [ ] Firewall configured
- [ ] System packages updated
- [ ] No sensitive data in logs

## 🚨 Reporting Security Issues

If you discover a security vulnerability, please email [your-email] instead of opening a public issue.

## 📋 Security Updates

Check this file regularly for security updates and best practices.
