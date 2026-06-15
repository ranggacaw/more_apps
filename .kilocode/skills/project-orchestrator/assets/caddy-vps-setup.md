# Caddy Setup on a VPS (Step-by-Step)

This guide walks you through installing and managing Caddy as a reverse proxy on a Ubuntu/Debian VPS. Caddy automatically handles HTTPS for all your domains — no manual SSL certificate setup needed.

---

## Prerequisites

Before starting, make sure:

1. You have a VPS running **Ubuntu 22.04 or Debian 12** (or newer).
2. You have SSH access to the VPS as a user with `sudo` privileges.
3. Your domain's **A record points to your VPS IP address** (set this in your domain registrar's DNS panel). DNS changes can take up to 30 minutes to propagate.

---

## Step 1: Connect to Your VPS

Open a terminal and connect via SSH:

```bash
ssh your-user@your-vps-ip
```

---

## Step 2: Install Caddy

Run these commands one by one:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list

sudo apt update && sudo apt install caddy
```

Verify the install:

```bash
caddy version
```

You should see a version number like `v2.x.x`.

---

## Step 3: Check That Caddy Is Running

Caddy starts automatically after install. Confirm it's active:

```bash
sudo systemctl status caddy
```

Look for `Active: active (running)`. If it's not running, start it:

```bash
sudo systemctl start caddy
sudo systemctl enable caddy   # make it start on boot
```

---

## Step 4: Open Firewall Ports

Allow HTTP and HTTPS traffic:

```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22    # keep SSH open
sudo ufw enable
sudo ufw status
```

---

## Step 5: Configure Your First Domain

The Caddy config file lives at `/etc/caddy/Caddyfile`. Open it:

```bash
sudo nano /etc/caddy/Caddyfile
```

Replace the default content with:

```caddy
your-domain.com {
    reverse_proxy localhost:3001
}
```

> Replace `your-domain.com` with your actual domain, and `3001` with the port your app is running on.

Save and close: press `Ctrl+X`, then `Y`, then `Enter`.

---

## Step 6: Reload Caddy

Apply the new config without downtime:

```bash
sudo systemctl reload caddy
```

Caddy will automatically obtain an SSL certificate for your domain. Visit `https://your-domain.com` — it should work with HTTPS out of the box.

---

## Adding a New Project Later

When you deploy a new project on the same VPS, just add a new block to the Caddyfile:

```bash
sudo nano /etc/caddy/Caddyfile
```

Add below the existing block:

```caddy
your-domain.com {
    reverse_proxy localhost:3001
}

another-project.com {
    reverse_proxy localhost:3002
}
```

Then reload:

```bash
sudo systemctl reload caddy
```

Each project gets its own SSL certificate automatically.

---

## Common Commands

| Task | Command |
|------|---------|
| Check Caddy status | `sudo systemctl status caddy` |
| Reload after config change | `sudo systemctl reload caddy` |
| Restart Caddy | `sudo systemctl restart caddy` |
| View live logs | `sudo journalctl -u caddy -f` |
| Validate config before reload | `caddy validate --config /etc/caddy/Caddyfile` |
| View current config | `cat /etc/caddy/Caddyfile` |

---

## Troubleshooting

**HTTPS not working / certificate error**
- Check that your domain's A record points to the VPS IP: `dig your-domain.com`
- Make sure ports 80 and 443 are open: `sudo ufw status`
- Check Caddy logs for errors: `sudo journalctl -u caddy -f`

**502 Bad Gateway**
- Your app is not running or not listening on the expected port.
- Check that your Docker containers are up: `docker compose ps`
- Verify the port in your Caddyfile matches the port your app exposes.

**Port already in use**
- Another process (e.g., Apache or Nginx) may be using port 80/443.
- Check: `sudo ss -tlnp | grep -E ':80|:443'`
- Stop the conflicting service: `sudo systemctl stop nginx` or `sudo systemctl stop apache2`

**Config change not taking effect**
- Always run `sudo systemctl reload caddy` after editing the Caddyfile.
- Validate first to catch syntax errors: `caddy validate --config /etc/caddy/Caddyfile`
