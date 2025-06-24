# Quick GitHub Token Setup (2 minutes!)

## 1. Get Your Token:
1. **Click this link**: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. **Name**: fantasy-ai-deployment
4. **Expiration**: 90 days (or custom)
5. **Check these scopes**:
   - ✅ **repo** (check the main checkbox - it selects all sub-options)
6. Click **"Generate token"** at the bottom
7. **COPY THE TOKEN!** (starts with `ghp_`)

## 2. Use the Token:

### Option A: Direct Push Command
```bash
cd /mnt/c/Users/st0ne/fantasy.AI-MVP
git push https://J-Stoned:YOUR_TOKEN_HERE@github.com/J-Stoned/fantasy-ai-mvp.git master-clean
```
Replace `YOUR_TOKEN_HERE` with your actual token (ghp_...)

### Option B: Run the Script
```bash
cd /mnt/c/Users/st0ne/fantasy.AI-MVP
./PUSH-NOW.sh
```
Then paste your token when prompted

## 3. After Successful Push:
- ✅ Go to: https://github.com/J-Stoned/fantasy-ai-mvp/actions
- ✅ You'll see "Continuous Data Collection" workflow running!
- ✅ It will run every 5 minutes automatically
- ✅ Your app starts collecting real data immediately!

## Example Token Format:
```
ghp_abcdef123456789example
```

Ready? Get your token and let's push! 🚀