// Quick script to test the API locally
const testApi = async () => {
  try {
    console.log('🧪 Testing local API...\n');
    
    // Test local API
    const localResponse = await fetch('http://localhost:3000/api/sports/live-players?limit=3');
    const localData = await localResponse.json();
    
    console.log('Local API response:');
    console.log('- Success:', localData.success);
    console.log('- Data source:', localData.meta?.dataSource);
    console.log('- Players returned:', localData.players?.length);
    
    if (localData.players?.[0]) {
      console.log('\nFirst player:', {
        name: localData.players[0].name,
        team: localData.players[0].team,
        position: localData.players[0].position,
        projectedPoints: localData.players[0].projectedPoints
      });
    }
    
    // Test production API
    console.log('\n\n🌐 Testing production API...\n');
    const prodResponse = await fetch('https://fantasy-ai-mvp.vercel.app/api/sports/live-players?limit=3');
    const prodData = await prodResponse.json();
    
    console.log('Production API response:');
    console.log('- Success:', prodData.success);
    console.log('- Data source:', prodData.meta?.dataSource);
    console.log('- Players returned:', prodData.players?.length);
    
    if (prodData.players?.[0]) {
      console.log('\nFirst player:', {
        name: prodData.players[0].name,
        team: prodData.players[0].team,
        position: prodData.players[0].position,
        projectedPoints: prodData.players[0].projectedPoints
      });
    }
    
    if (prodData.meta?.dataSource === 'fallback') {
      console.log('\n⚠️  Production is using fallback data! Database connection issue.');
      console.log('This usually means:');
      console.log('1. DATABASE_URL env var not set in Vercel');
      console.log('2. Database connection timeout');
      console.log('3. Query error (like we just fixed)');
    } else {
      console.log('\n✅ Production is using live data from database!');
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
};

testApi();