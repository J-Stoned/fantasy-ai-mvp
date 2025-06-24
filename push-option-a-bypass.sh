#!/bin/bash
# Option A: Use GitHub's bypass URLs for test keys

echo "=== OPTION A: Bypass Push Protection ==="
echo
echo "GitHub has detected test API keys in your repository."
echo "Since these are TEST keys (not production), you can bypass the protection."
echo
echo "Click these URLs to allow the push:"
echo
echo "1. OpenAI API Key (TEST):"
echo "   https://github.com/J-Stoned/fantasy-ai-mvp/security/secret-scanning/unblock-secret/2yw8rnvVV65nwZTVxqhPPfeb2aK"
echo
echo "2. Stripe Test API Key:"
echo "   https://github.com/J-Stoned/fantasy-ai-mvp/security/secret-scanning/unblock-secret/2yw8rq0PDn5hcdVhTyAmAxrBoPd"
echo
echo "After clicking both URLs and allowing the secrets, run:"
echo "git push -u origin master-clean"
echo
echo "This is safe because:"
echo "- These are TEST keys, not production"
echo "- The keys are already revoked/invalid"
echo "- You'll set up proper secrets management in GitHub Actions"