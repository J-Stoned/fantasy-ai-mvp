# 🚀 FANTASY.AI DEPLOYMENT CHECKLIST

## Phase 1: Vercel Deployment (Frontend & API)

### Pre-Deployment
- [x] Fix all TypeScript errors
- [x] Add build-time skip flags for MCP/ML initialization
- [x] Update .vercelignore to exclude unnecessary files
- [x] Create production build script
- [x] Set up cron job API endpoints
- [x] Configure vercel.json with cron schedules

### Environment Variables (Add to Vercel Dashboard)
- [ ] `DATABASE_URL` - Your Supabase connection string
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `OPENAI_API_KEY` - OpenAI API key
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key
- [ ] `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `NEXTAUTH_SECRET` - Random string for auth
- [ ] `NEXTAUTH_URL` - Your production URL
- [ ] `CRON_SECRET` - Random string for cron authentication
- [ ] `OPENWEATHER_API_KEY` - Weather API key
- [ ] `ODDS_API_KEY` - Odds API key
- [ ] `NEWS_API_KEY` - News API key
- [ ] `BALLDONTLIE_API_KEY` - NBA API key

### Deployment Steps
1. [ ] Clean up log files: `rm -f *.log scripts/*.log`
2. [ ] Deploy to Vercel: `vercel --prod`
3. [ ] Verify deployment at production URL
4. [ ] Check cron jobs are scheduled
5. [ ] Test API endpoints

## Phase 2: AWS Infrastructure (24/7 Processing)

### AWS Account Setup
- [ ] Sign up for AWS Free Tier
- [ ] Apply for AWS Activate credits ($1000-5000)
- [ ] Create IAM user with programmatic access
- [ ] Install AWS CLI locally
- [ ] Configure AWS credentials

### EC2 Instance (Free Tier)
- [ ] Launch t2.micro instance (Ubuntu 22.04)
- [ ] Configure security groups (SSH, HTTP, HTTPS)
- [ ] Assign Elastic IP
- [ ] SSH into instance
- [ ] Run setup script: `deployment/aws/setup-ec2.sh`

### GitHub Actions Setup
- [ ] Add repository secrets:
  - [ ] `DATABASE_URL`
  - [ ] `OPENAI_API_KEY`
  - [ ] `DISCORD_WEBHOOK` (optional)
  - [ ] All other API keys
- [ ] Enable GitHub Actions
- [ ] Verify workflows are running

### Docker Deployment
- [ ] Build Docker images
- [ ] Push to Docker Hub or ECR
- [ ] Deploy with docker-compose
- [ ] Verify services are running
- [ ] Check logs for errors

## Phase 3: Monitoring & Optimization

### Monitoring Setup
- [ ] CloudWatch dashboards
- [ ] Uptime monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance metrics

### Cost Optimization
- [ ] Enable AWS Budget Alerts
- [ ] Use spot instances for ML training
- [ ] Implement auto-scaling
- [ ] Review and optimize queries

### Production Validation
- [ ] Test data collection is working
- [ ] Verify ML models are training
- [ ] Check database is updating
- [ ] Validate API responses
- [ ] Test user authentication
- [ ] Verify payment processing

## Phase 4: Launch Preparation

### Performance
- [ ] Load testing with k6 or Artillery
- [ ] CDN configuration
- [ ] Image optimization
- [ ] Bundle size optimization

### Security
- [ ] API rate limiting
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CORS configuration

### Documentation
- [ ] API documentation
- [ ] Deployment runbook
- [ ] Troubleshooting guide
- [ ] Recovery procedures

## 🎉 Launch Day
- [ ] Announce on social media
- [ ] Monitor system health
- [ ] Be ready for scaling
- [ ] Celebrate! 🍾

## Quick Commands

### Deploy to Vercel
```bash
vercel --prod
```

### SSH to EC2
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Check Docker Services
```bash
docker-compose ps
docker-compose logs -f
```

### Monitor Logs
```bash
vercel logs --follow
```

## Support Contacts
- Vercel Support: support@vercel.com
- AWS Support: Via AWS Console
- Supabase Support: support@supabase.io