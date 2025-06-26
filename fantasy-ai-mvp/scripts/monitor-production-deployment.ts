// Monitor production deployment status
const checkDeployment = async () => {
  console.log('🚀 MONITORING PRODUCTION DEPLOYMENT...\n');
  
  const endpoints = [
    { name: 'Health Check', url: 'https://fantasy-ai-mvp.vercel.app/api/health' },
    { name: 'Live Players API', url: 'https://fantasy-ai-mvp.vercel.app/api/sports/live-players?limit=3' },
    { name: 'Homepage', url: 'https://fantasy-ai-mvp.vercel.app' }
  ];
  
  console.log('⏳ Waiting 90 seconds for Vercel deployment to complete...\n');
  await new Promise(resolve => setTimeout(resolve, 90000));
  
  console.log('🔍 Checking production endpoints:\n');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url);
      const data = await response.json().catch(() => null);
      
      console.log(`📍 ${endpoint.name}:`);
      console.log(`   URL: ${endpoint.url}`);
      console.log(`   Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
      
      if (endpoint.name === 'Health Check' && data) {
        console.log(`   Database: ${data.database?.connected ? '✅ Connected' : '❌ Not Connected'}`);
        console.log(`   Players: ${data.database?.playerCount || 0}`);
        console.log(`   Environment: ${data.environment}`);
        console.log(`   Response Time: ${data.performance?.totalResponseTime}`);
      }
      
      if (endpoint.name === 'Live Players API' && data) {
        console.log(`   Data Source: ${data.meta?.dataSource === 'live' ? '✅ LIVE DATA' : '⚠️ Fallback'}`);
        console.log(`   Players Returned: ${data.players?.length || 0}`);
        if (data.players?.[0]) {
          console.log(`   First Player: ${data.players[0].name} (${data.players[0].team})`);
        }
      }
      
      console.log('');
    } catch (error) {
      console.log(`📍 ${endpoint.name}: ❌ ERROR`);
      console.log(`   ${error.message}\n`);
    }
  }
  
  console.log('\n📊 DEPLOYMENT SUMMARY:');
  console.log('====================');
  console.log('If Health Check shows "Database: ✅ Connected" - SUCCESS!');
  console.log('If Live Players API shows "Data Source: ✅ LIVE DATA" - FULL POWER RESTORED!');
  console.log('\n🎯 Next Steps:');
  console.log('1. If still showing fallback data, check Vercel environment variables');
  console.log('2. Visit https://vercel.com/your-project/settings/environment-variables');
  console.log('3. Ensure DATABASE_URL and DIRECT_URL are set for Production');
  console.log('4. Trigger a redeploy if needed');
};

checkDeployment().catch(console.error);