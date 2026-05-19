# VPS Deployment

## 1. Provision the server
- Ubuntu 24.04 LTS on a VPS with Docker Engine and Docker Compose installed
- Point your domain to the VPS IP before enabling SSL
- Copy `.env.example` to `.env` and replace the database, Midtrans, mail, and Fonnte credentials
- You can bootstrap Docker, Certbot, and the application directories with `deploy/vps/provision.sh`

## 2. Deploy the application
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 3. Enable SSL
- Install Certbot on the VPS host
- Request certificates for the public domain
- Mount `/etc/letsencrypt` into the production Nginx container as already defined in `docker-compose.prod.yml`
- Update the Nginx server block if you want an HTTPS redirect or custom domain names

## 4. Backups
- Use `deploy/vps/backup.sh` from cron to create timestamped PostgreSQL dumps
- Store dumps on attached block storage or sync them to off-server storage

## 5. Ongoing deploys
- Pull the latest code
- Run `deploy/vps/deploy.sh`
- Check `docker compose ps` and the queue worker logs after each release
