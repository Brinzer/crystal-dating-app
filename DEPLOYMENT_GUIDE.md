# Crystal Dating App - Deployment Guide
**How to Deploy to Your Porkbun Domain**

---

## 🎯 Overview

This guide will help you deploy the Crystal Dating App to your Porkbun domain with full dynamic editing capabilities.

### Recommended Approach: Render.com + Porkbun

**Why Render?**
- ✅ Free tier with custom domain support
- ✅ Automatic SSL certificates
- ✅ GitHub integration (auto-deploy on push)
- ✅ Supports Node.js/Express perfectly
- ✅ Easy dynamic editing workflow
- ✅ Zero downtime deployments

---

## 📋 Prerequisites

1. **Porkbun Domain** (you have this!)
2. **GitHub Account** (for code repository)
3. **Render Account** (free - sign up at render.com)
4. **Git installed** on your local machine

---

## 🚀 Step-by-Step Deployment

### Phase 1: Prepare Your Code

#### 1.1 Create GitHub Repository

```bash
# Navigate to project directory
cd "E:\cursor projects\Crystal dating app"

# Initialize git (if not already done)
git init

# Add all files
git add -A

# Commit
git commit -m "Initial deployment commit"

# Create repository on GitHub (via web interface)
# Then link it:
git remote add origin https://github.com/YOUR_USERNAME/crystal-dating.git
git branch -M main
git push -u origin main
```

#### 1.2 Add Production Configuration

Create `package.json` start script (if not already present):

```json
{
  "scripts": {
    "start": "node src/server/simpleServer.js",
    "dev": "node src/server/simpleServer.js"
  }
}
```

#### 1.3 Set PORT Environment Variable

Update `src/server/simpleServer.js` to use environment PORT:

```javascript
const PORT = process.env.PORT || 3500;
```

*(This is already configured in your code)*

---

### Phase 2: Deploy to Render

#### 2.1 Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click "Get Started"
3. Sign up with GitHub (recommended for easy integration)

#### 2.2 Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select `crystal-dating` repository

#### 2.3 Configure Service

**Basic Settings:**
- **Name**: `crystal-dating` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave blank
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Select **"Free"** tier

#### 2.4 Environment Variables

Add these in Render dashboard:
- `NODE_ENV` = `production`
- `DB_SIZE` = `100` (or `1000`)

#### 2.5 Deploy

1. Click **"Create Web Service"**
2. Wait for initial deployment (2-5 minutes)
3. Render will provide a URL like: `https://crystal-dating.onrender.com`

**Test this URL to make sure the app works!**

---

### Phase 3: Connect Porkbun Domain

#### 3.1 Get Render's IP Address

1. In Render dashboard, go to your service
2. Click **"Custom Domain"** tab
3. Click **"Add Custom Domain"**
4. Enter your domain: `yourdomain.com`
5. Render will show you the IP address to use

**Example IP**: `216.24.57.1` (your actual IP will be different)

#### 3.2 Configure Porkbun DNS

1. Log in to [Porkbun.com](https://porkbun.com)
2. Go to **"Domain Management"**
3. Find your domain, click **"Details"** → Edit DNS icon

#### 3.3 Add A Records

**Delete old records** (if any A, ALIAS, or CNAME records exist for root or www)

**Add two new A records:**

**Record 1 (www subdomain):**
- Type: `A - Address record`
- Host: `www`
- Answer: `[Render's IP address]`
- TTL: `600` (default)

**Record 2 (root domain):**
- Type: `A - Address record`
- Host: ` ` (leave blank)
- Answer: `[Render's IP address]`
- TTL: `600` (default)

Click **"Save"**

#### 3.4 Verify in Render

1. Go back to Render dashboard
2. In Custom Domain tab, click **"Verify"**
3. Wait for DNS propagation (5-30 minutes)
4. Render will automatically provision SSL certificate

---

### Phase 4: Enable Dynamic Editing Workflow

#### 4.1 Local Development Setup

```bash
# Clone your repository on any machine
git clone https://github.com/YOUR_USERNAME/crystal-dating.git
cd crystal-dating

# Install dependencies
npm install

# Run locally
npm start

# Visit: http://localhost:3500
```

#### 4.2 Make Changes and Deploy

```bash
# Make your code changes
# Edit files in src/client/, src/server/, etc.

# Test locally
npm start

# Commit and push
git add -A
git commit -m "Updated feature X"
git push origin main
```

**🎉 Render automatically deploys within 2-5 minutes!**

#### 4.3 Instant Preview

- **Live site**: `https://yourdomain.com`
- **Render URL**: `https://crystal-dating.onrender.com` (backup)
- **Deployment logs**: Available in Render dashboard

---

## 🔧 Alternative: Manual SFTP Deployment

If you prefer Porkbun's own hosting:

### Option B: Porkbun Static/EasyPHP Hosting

#### B.1 Purchase Hosting

1. Go to Porkbun → **Products** → **Web Hosting**
2. Choose **EasyPHP Hosting** ($2.50/mo)
3. Complete purchase

#### B.2 Get FTP Credentials

1. Porkbun will email you:
   - FTP hostname
   - FTP username
   - FTP password
   - Database credentials (if applicable)

#### B.3 Upload Files

Use an FTP client (FileZilla recommended):

```
Host: ftp.yourdomain.com
Username: [from email]
Password: [from email]
Port: 21
```

Upload all files from:
- `src/client/` → `/public_html/`
- `src/server/` → `/server/` (if PHP hosting supports Node.js)

**Note**: Most shared PHP hosting doesn't support Node.js backend. You'll need to convert the backend to PHP or use a different approach.

---

## 🎨 Recommended Workflow: Hybrid Approach

**Best of both worlds:**

1. **Backend on Render** (free, supports Node.js)
   - All API endpoints
   - Database management
   - Express server

2. **Frontend on Porkbun Static Hosting** ($2.50/mo or free tier)
   - HTML, CSS, JavaScript files
   - Faster delivery
   - Simple updates via FTP

3. **Update API_BASE** in all client JavaScript files:
   ```javascript
   const API_BASE = 'https://crystal-dating.onrender.com/api';
   ```

---

## 📝 Quick Reference Commands

### Deploy Updates
```bash
git add -A
git commit -m "Your update description"
git push origin main
# Wait 2-5 minutes for auto-deploy
```

### Check Deployment Status
```bash
# View logs in Render dashboard
# Or use Render CLI:
npm install -g @render/cli
render logs
```

### Rollback to Previous Version
```bash
# In Render dashboard:
# Services → [Your Service] → Events → Revert to previous deploy
```

---

## 🐛 Troubleshooting

### DNS Not Propagating
- Wait up to 48 hours (usually 5-30 minutes)
- Check with: `nslookup yourdomain.com`
- Clear browser cache

### SSL Certificate Not Working
- Ensure DNS is fully propagated first
- Render auto-provisions after verification
- Can take up to 1 hour

### App Not Loading
1. Check Render logs for errors
2. Verify environment variables
3. Test the `.onrender.com` URL first
4. Check database connection settings

### Port Issues
- Render assigns port dynamically
- Must use `process.env.PORT`
- Default port 3500 is for local only

---

## 💰 Cost Breakdown

### Free Option (Recommended)
- **Render Free Tier**: $0/month
- **Porkbun Domain**: ~$10/year
- **Total**: ~$0.83/month

### Paid Option (Better Performance)
- **Render Starter**: $7/month
- **Porkbun Domain**: ~$10/year
- **Total**: ~$7.83/month

### Hybrid Option
- **Render Free Tier**: $0/month
- **Porkbun Static Hosting**: $2.50/month
- **Porkbun Domain**: ~$10/year
- **Total**: ~$3.33/month

---

## 🎯 Summary

**Easiest Path to Production:**

1. ✅ Push code to GitHub
2. ✅ Deploy to Render (free tier)
3. ✅ Point Porkbun A records to Render IP
4. ✅ Wait for DNS propagation (5-30 min)
5. ✅ Edit code locally, push to deploy

**Dynamic Editing = Git Push!**

Every `git push` triggers automatic deployment. Changes live in minutes.

---

## 📧 Next Steps

Once deployed:
1. Test all features on live domain
2. Set up monitoring (Render provides basic metrics)
3. Configure custom error pages
4. Add Google Analytics (optional)
5. Set up automated backups

---

**🎉 Your Crystal Dating App will be live at your Porkbun domain!**

For questions or issues, check:
- Render Docs: https://render.com/docs
- Porkbun KB: https://kb.porkbun.com
- GitHub Issues: (your repository)

*Last updated: 2025-09-30*
