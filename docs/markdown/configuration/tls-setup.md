# TLS Setup

Enable HTTPS for secure communication between AI clients and the Moonsurf server.

## Overview

TLS (HTTPS) encrypts communication and provides:
- Data encryption in transit
- Server authentication
- Protection against man-in-the-middle attacks

## Basic Configuration

```bash
TLS_ENABLED=true \
TLS_CERT_PATH=/path/to/cert.pem \
TLS_KEY_PATH=/path/to/key.pem \
moonsurf
```

## Certificate Options

### Option 1: Let's Encrypt (Production)

Free, automated, and widely trusted certificates.

#### Using Certbot

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d mcp.example.com

# Certificate locations
# /etc/letsencrypt/live/mcp.example.com/fullchain.pem
# /etc/letsencrypt/live/mcp.example.com/privkey.pem
```

#### Running Moonsurf

```bash
TLS_ENABLED=true \
TLS_CERT_PATH=/etc/letsencrypt/live/mcp.example.com/fullchain.pem \
TLS_KEY_PATH=/etc/letsencrypt/live/mcp.example.com/privkey.pem \
AUTH_TOKENS=secret-token \
moonsurf
```

#### Auto-renewal

Certbot sets up auto-renewal. After renewal, restart Moonsurf:

```bash
# Certbot renewal hook
sudo certbot renew --deploy-hook "systemctl restart moonsurf"
```

### Option 2: Self-Signed (Development/Testing)

For development or internal use.

#### Generate Certificate

```bash
# Create private key
openssl genrsa -out key.pem 2048

# Create certificate signing request
openssl req -new -key key.pem -out csr.pem \
  -subj "/CN=localhost"

# Create self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in csr.pem \
  -signkey key.pem -out cert.pem

# Clean up
rm csr.pem
```

#### With Subject Alternative Names

For multiple hostnames:

```bash
# Create config file
cat > openssl.cnf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
CN = localhost

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = mcp.local
IP.1 = 127.0.0.1
EOF

# Generate key and certificate
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -config openssl.cnf
```

#### Running Moonsurf

```bash
TLS_ENABLED=true \
TLS_CERT_PATH=./cert.pem \
TLS_KEY_PATH=./key.pem \
moonsurf
```

#### Client Configuration

For self-signed certificates, clients may need to:

**Node.js:**
```javascript
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

**curl:**
```bash
curl -k https://localhost:3300/health
```

### Option 3: Reverse Proxy (Recommended for Production)

Let a reverse proxy handle TLS:

```
Internet ──HTTPS──► Nginx/Caddy ──HTTP──► Moonsurf
                      (TLS)                (No TLS)
```

#### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name mcp.example.com;

    ssl_certificate /etc/letsencrypt/live/mcp.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3300;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
```

Run Moonsurf without TLS:
```bash
REMOTE_MODE=true \
PUBLIC_URL=https://mcp.example.com \
AUTH_TOKENS=secret-token \
TLS_ENABLED=false \
moonsurf
```

#### Caddy

```
mcp.example.com {
    reverse_proxy localhost:3300
}
```

Caddy automatically handles TLS certificates.

## Verification

### Check Server

```bash
# With valid certificate
curl https://mcp.example.com/health

# With self-signed certificate
curl -k https://localhost:3300/health
```

### Check Certificate

```bash
openssl s_client -connect localhost:3300 -servername localhost
```

### Check Configuration

Server output shows TLS status:
```
[Config]   TLS: ENABLED
```

## Client Configuration

### Claude Code

```json
{
  "mcpServers": {
    "moonsurf": {
      "url": "https://mcp.example.com/sse?token=secret"
    }
  }
}
```

### Custom Client

```javascript
// HTTPS works automatically with valid certificates
const eventSource = new EventSource(
  'https://mcp.example.com/sse?token=secret'
);
```

## Certificate Formats

### PEM Format (Required)

Moonsurf requires PEM format certificates:

**Certificate:**
```
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAJC1...
-----END CERTIFICATE-----
```

**Private Key:**
```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0B...
-----END PRIVATE KEY-----
```

### Converting from Other Formats

**From PFX/PKCS12:**
```bash
openssl pkcs12 -in cert.pfx -out cert.pem -nodes
openssl pkcs12 -in cert.pfx -out key.pem -nodes -nocerts
```

**From DER:**
```bash
openssl x509 -inform DER -in cert.der -out cert.pem
openssl rsa -inform DER -in key.der -out key.pem
```

## Certificate Chain

For certificates with intermediate CAs, combine into one file:

```bash
cat domain.crt intermediate.crt root.crt > fullchain.pem
```

## Troubleshooting

### "TLS enabled but cert/key paths not provided"

Both paths are required:
```bash
TLS_ENABLED=true \
TLS_CERT_PATH=/path/to/cert.pem \
TLS_KEY_PATH=/path/to/key.pem \
moonsurf
```

### "ENOENT: no such file"

Check file paths exist and are readable:
```bash
ls -la /path/to/cert.pem /path/to/key.pem
```

### "Certificate has expired"

Renew the certificate:
```bash
# Let's Encrypt
sudo certbot renew
```

### "Self-signed certificate" errors

For testing, configure clients to accept self-signed certs or use a valid certificate.

### Permission denied

Ensure the process can read the certificate files:
```bash
sudo chmod 644 cert.pem
sudo chmod 600 key.pem
```

## Security Best Practices

1. **Use Let's Encrypt** for production (free, trusted)
2. **Automate renewal** to avoid expiration
3. **Protect private keys** (chmod 600)
4. **Use strong ciphers** (proxy configuration)
5. **Enable HSTS** for web clients (proxy configuration)

## Related

- [Remote Mode](remote-mode.md) - Production deployment
- [Authentication](authentication.md) - Token security
- [Security Hardening](security-hardening.md) - Additional measures
