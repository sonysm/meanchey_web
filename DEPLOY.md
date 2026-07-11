# Meanchey Web Project

This is a Next.js project. This README provides instructions on how to deploy it to a production environment on an Ubuntu server.

## Deploying to an Ubuntu Server

This guide covers deploying the Next.js application using Nginx as a reverse proxy and PM2 as a process manager.

### 1. Server Prerequisites

Before you begin, ensure your Ubuntu server has the following installed:

*   **Node.js**: Next.js requires a recent version of Node.js (v20.9 or later is recommended). You can use nvm to manage Node.js versions.
*   **Git**: To clone your project repository.
*   **Nginx**: To act as a reverse proxy.
*   **PM2**: A process manager to keep your application running.

Install the prerequisites:

```bash
# Update package list
sudo apt update

# Install Nginx
sudo apt install nginx

# Install Node.js (example with NodeSource for Node.js 20.x)
curl -fsSL <https://deb.nodesource.com/setup_20.x> | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install pm2 -g
```

### 2. Get the Code

Clone your project from your Git repository onto the server.

```bash
git clone <your-repository-url>
cd meanchey_web
```

### 3. Install Dependencies and Build

Install the project dependencies and build the application for production.

```bash
# Install dependencies
npm install

# Build the application
npm run build
```

### 4. Set Up Environment Variables

Your application likely needs environment variables for things like database connections or API keys. Create a `.env.local` file in the root of your project on the server. **Do not commit this file to Git.**

```bash
nano .env.local
```

Add your production environment variables to this file:

```ini
# .env.local
DB_HOST=...
API_KEY=...
```

### 5. Start the Application with PM2

Use PM2 to start your Next.js application. This will run it in the background and automatically restart it if it crashes.

```bash
# Start the app with the name 'meanchey-web'
pm2 start npm --name "meanchey-web" -- start

#with ecosystem
pm2 start ecosystem.config.js --env production



# To ensure your app restarts on server reboot
pm2 startup
pm2 save
```

By default, the Next.js production server starts on port 3000.

### 6. Configure Nginx as a Reverse Proxy

Create an Nginx server block configuration file to proxy requests from the public port 80 to your application's port 3000.

```bash
sudo nano /etc/nginx/sites-available/adm.meanchey.org
```

Add the following configuration. Replace `your_domain.com` with your server's domain name or IP address.

```nginx
server {
    listen 80;
    server_name adm.meanchey.org www.adm.meanchey.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable this configuration by creating a symbolic link to `sites-enabled`.

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/adm.meanchey.org /etc/nginx/sites-enabled/

# Test Nginx configuration for syntax errors
sudo nginx -t

# Restart Nginx to apply the changes
sudo systemctl restart nginx
```

### 7. Configure Firewall

If you have a firewall like `ufw` enabled, allow HTTP and HTTPS traffic through Nginx.

```bash
sudo ufw allow 'Nginx Full'
```

Your Next.js application should now be accessible via your server's domain or IP address!

### (Optional) Securing with SSL (Let's Encrypt)

For a production site, you should always use HTTPS. You can get a free SSL certificate from Let's Encrypt using Certbot.

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain and install a certificate
sudo certbot --nginx -d adm.meanchey.org -d www.adm.meanchey.org
```

Certbot will automatically update your Nginx configuration to handle HTTPS and set up automatic certificate renewal.
