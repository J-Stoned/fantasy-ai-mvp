#!/usr/bin/env tsx

/**
 * 🌐💥 REAL API DATA COLLECTOR - ACTUAL DATA FLOWING TO SUPABASE! 💥🌐
 * Uses real APIs to collect and store data in your database
 */

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

// API Configuration
const API_CONFIG = {
  // Ball Don't Lie - FREE NBA API (no key needed!)
  ballDontLie: {
    base: 'https://www.balldontlie.io/api/v1',
    endpoints: {
      players: '/players',
      teams: '/teams',
      games: '/games',
      stats: '/stats'
    }
  },
  // OpenWeather API
  openWeather: {
    base: 'https://api.openweathermap.org/data/2.5',
    key: process.env.OPENWEATHER_API_KEY
  },
  // The Odds API
  odds: {
    base: 'https://api.the-odds-api.com/v4',
    key: process.env.ODDS_API_KEY
  },
  // News API
  news: {
    base: 'https://newsapi.org/v2',
    key: process.env.NEWS_API_KEY
  }
};

// Stadium coordinates for weather data
const STADIUM_COORDS = {
  'Arrowhead Stadium': { lat: 39.0489, lon: -94.4839, team: 'Kansas City Chiefs' },
  'Gillette Stadium': { lat: 42.0909, lon: -71.2643, team: 'New England Patriots' },
  'MetLife Stadium': { lat: 40.8128, lon: -74.0742, team: 'New York Giants' },
  'Lambeau Field': { lat: 44.5013, lon: -88.0622, team: 'Green Bay Packers' },
  'AT&T Stadium': { lat: 32.7473, lon: -97.0945, team: 'Dallas Cowboys' }
};

class RealAPIDataCollector {
  private collectionStats = {
    players: 0,
    games: 0,
    weather: 0,
    odds: 0,
    news: 0,
    errors: 0
  };

  async collectAll() {
    console.log('🌐💥 REAL API DATA COLLECTION STARTING! 💥🌐');
    console.log('============================================\n');

    // Check which APIs are configured
    this.checkAPIKeys();

    // Start collecting from different sources
    await Promise.all([
      this.collectNBAData(),
      this.collectWeatherData(),
      this.collectOddsData(),
      this.collectNewsData()
    ]);

    // Save collection summary
    await this.saveCollectionSummary();
    
    console.log('\n📊 COLLECTION COMPLETE!');
    console.log(`✅ Players: ${this.collectionStats.players}`);
    console.log(`✅ Games: ${this.collectionStats.games}`);
    console.log(`✅ Weather: ${this.collectionStats.weather}`);
    console.log(`✅ Odds: ${this.collectionStats.odds}`);
    console.log(`✅ News: ${this.collectionStats.news}`);
    console.log(`❌ Errors: ${this.collectionStats.errors}`);
  }

  private checkAPIKeys() {
    console.log('🔑 API Key Status:');
    console.log(`   OpenWeather: ${API_CONFIG.openWeather.key ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Odds API: ${API_CONFIG.odds.key ? '✅ Found' : '❌ Missing'}`);
    console.log(`   News API: ${API_CONFIG.news.key ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Ball Don't Lie: ✅ No key needed!\n`);
  }

  // Collect NBA data from Ball Don't Lie (FREE!)
  async collectNBAData() {
    console.log('🏀 Collecting NBA data from Ball Don\'t Lie...');
    
    try {
      // Get players
      const playersResponse = await fetch(`${API_CONFIG.ballDontLie.base}/players?per_page=100`);
      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        
        for (const player of playersData.data.slice(0, 20)) { // First 20 players
          if (player.first_name && player.last_name) {
            try {
              // Check if we have a league for NBA
              let league = await prisma.league.findFirst({
                where: { sport: 'BASKETBALL' }
              });

              if (!league) {
                // Create a league if none exists
                league = await prisma.league.create({
                  data: {
                    userId: 'system',
                    provider: 'BALLDONTLIE',
                    providerId: 'nba-2025',
                    name: 'NBA 2024-25 Season',
                    season: '2025',
                    sport: 'BASKETBALL',
                    settings: JSON.stringify({})
                  }
                });
              }

              // Create or update player
              await prisma.player.upsert({
                where: {
                  externalId_leagueId: {
                    externalId: `bdl_${player.id}`,
                    leagueId: league.id
                  }
                },
                update: {
                  name: `${player.first_name} ${player.last_name}`,
                  team: player.team?.full_name || 'Free Agent',
                  stats: JSON.stringify({
                    height: player.height_feet ? `${player.height_feet}'${player.height_inches}"` : 'N/A',
                    weight: player.weight_pounds || 0,
                    jerseyNumber: player.jersey_number || 0
                  }),
                  updatedAt: new Date()
                },
                create: {
                  externalId: `bdl_${player.id}`,
                  name: `${player.first_name} ${player.last_name}`,
                  position: player.position || 'N/A',
                  team: player.team?.full_name || 'Free Agent',
                  leagueId: league.id,
                  stats: JSON.stringify({
                    height: player.height_feet ? `${player.height_feet}'${player.height_inches}"` : 'N/A',
                    weight: player.weight_pounds || 0,
                    jerseyNumber: player.jersey_number || 0
                  })
                }
              });

              this.collectionStats.players++;
              console.log(`   ✅ Added: ${player.first_name} ${player.last_name}`);
            } catch (error) {
              console.error(`   ❌ Error adding player: ${error.message}`);
              this.collectionStats.errors++;
            }
          }
        }
      }

      // Get recent games
      const gamesResponse = await fetch(`${API_CONFIG.ballDontLie.base}/games?per_page=10`);
      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json();
        
        for (const game of gamesData.data) {
          try {
            await prisma.gameData.upsert({
              where: { externalId: `bdl_game_${game.id}` },
              update: {
                homeScore: game.home_team_score,
                awayScore: game.visitor_team_score,
                status: game.status,
                updatedAt: new Date()
              },
              create: {
                externalId: `bdl_game_${game.id}`,
                sport: 'BASKETBALL',
                homeTeam: game.home_team.full_name,
                awayTeam: game.visitor_team.full_name,
                gameTime: new Date(game.date),
                homeScore: game.home_team_score,
                awayScore: game.visitor_team_score,
                status: game.status,
                venue: game.home_team.city
              }
            });
            this.collectionStats.games++;
          } catch (error) {
            this.collectionStats.errors++;
          }
        }
      }
    } catch (error) {
      console.error('❌ Ball Don\'t Lie API error:', error.message);
      this.collectionStats.errors++;
    }
  }

  // Collect weather data for stadiums
  async collectWeatherData() {
    if (!API_CONFIG.openWeather.key) {
      console.log('⏭️ Skipping weather data (no API key)');
      return;
    }

    console.log('🌤️ Collecting weather data...');

    for (const [stadium, coords] of Object.entries(STADIUM_COORDS)) {
      try {
        const url = `${API_CONFIG.openWeather.base}/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_CONFIG.openWeather.key}&units=imperial`;
        const response = await fetch(url);
        
        if (response.ok) {
          const weatherData = await response.json();
          
          // Find upcoming game at this venue
          const upcomingGame = await prisma.gameData.findFirst({
            where: {
              venue: stadium,
              status: 'SCHEDULED'
            }
          });

          if (upcomingGame) {
            // Update game with weather data
            await prisma.gameData.update({
              where: { id: upcomingGame.id },
              data: {
                weather: JSON.stringify({
                  temp: weatherData.main.temp,
                  feels_like: weatherData.main.feels_like,
                  humidity: weatherData.main.humidity,
                  wind_speed: weatherData.wind.speed,
                  wind_deg: weatherData.wind.deg,
                  conditions: weatherData.weather[0].main,
                  description: weatherData.weather[0].description
                })
              }
            });
          }

          // Also create a news article about weather conditions
          await prisma.newsArticle.create({
            data: {
              source: 'OpenWeather',
              title: `Weather Update: ${weatherData.main.temp}°F at ${stadium}`,
              content: `Current conditions at ${stadium}: ${weatherData.weather[0].description}. Temperature: ${weatherData.main.temp}°F, Wind: ${weatherData.wind.speed} mph.`,
              url: `weather_${stadium}_${Date.now()}`,
              publishedAt: new Date(),
              sport: 'FOOTBALL',
              category: 'weather'
            }
          });

          this.collectionStats.weather++;
          console.log(`   ✅ Weather for ${stadium}: ${weatherData.main.temp}°F`);
        }
      } catch (error) {
        console.error(`   ❌ Weather error for ${stadium}:`, error.message);
        this.collectionStats.errors++;
      }

      // Rate limit respect
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Collect betting odds
  async collectOddsData() {
    if (!API_CONFIG.odds.key) {
      console.log('⏭️ Skipping odds data (no API key)');
      return;
    }

    console.log('💰 Collecting betting odds...');

    try {
      // Get available sports
      const sportsUrl = `${API_CONFIG.odds.base}/sports?apiKey=${API_CONFIG.odds.key}`;
      const sportsResponse = await fetch(sportsUrl);
      
      if (sportsResponse.ok) {
        const sports = await sportsResponse.json();
        
        // Get odds for NFL if available
        const nfl = sports.find((s: any) => s.key === 'americanfootball_nfl');
        if (nfl) {
          const oddsUrl = `${API_CONFIG.odds.base}/sports/americanfootball_nfl/odds?apiKey=${API_CONFIG.odds.key}&regions=us`;
          const oddsResponse = await fetch(oddsUrl);
          
          if (oddsResponse.ok) {
            const oddsData = await oddsResponse.json();
            
            for (const game of oddsData.slice(0, 5)) { // First 5 games
              try {
                // Create news article about betting lines
                await prisma.newsArticle.create({
                  data: {
                    source: 'The Odds API',
                    title: `Betting Update: ${game.home_team} vs ${game.away_team}`,
                    content: `Latest odds for ${game.home_team} vs ${game.away_team}. Check your sportsbook for current lines.`,
                    url: `odds_${game.id}_${Date.now()}`,
                    publishedAt: new Date(game.commence_time),
                    sport: 'FOOTBALL',
                    teams: JSON.stringify([game.home_team, game.away_team]),
                    category: 'betting'
                  }
                });
                this.collectionStats.odds++;
              } catch (error) {
                this.collectionStats.errors++;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Odds API error:', error.message);
      this.collectionStats.errors++;
    }
  }

  // Collect sports news
  async collectNewsData() {
    if (!API_CONFIG.news.key) {
      console.log('⏭️ Skipping news data (no API key)');
      return;
    }

    console.log('📰 Collecting sports news...');

    try {
      const queries = ['NFL', 'NBA', 'fantasy football', 'player injury'];
      
      for (const query of queries) {
        const url = `${API_CONFIG.news.base}/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${API_CONFIG.news.key}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const newsData = await response.json();
          
          for (const article of newsData.articles || []) {
            try {
              // Skip if already exists
              const exists = await prisma.newsArticle.findUnique({
                where: { url: article.url }
              });

              if (!exists && article.title && article.url) {
                await prisma.newsArticle.create({
                  data: {
                    source: article.source.name || 'Unknown',
                    title: article.title.substring(0, 255),
                    content: article.description || article.content || '',
                    summary: article.description,
                    url: article.url,
                    author: article.author,
                    publishedAt: new Date(article.publishedAt),
                    sport: query.includes('NFL') ? 'FOOTBALL' : query.includes('NBA') ? 'BASKETBALL' : 'GENERAL',
                    imageUrl: article.urlToImage,
                    category: 'news'
                  }
                });
                this.collectionStats.news++;
                console.log(`   ✅ News: ${article.title.substring(0, 50)}...`);
              }
            } catch (error) {
              this.collectionStats.errors++;
            }
          }
        }

        // Rate limit respect
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('❌ News API error:', error.message);
      this.collectionStats.errors++;
    }
  }

  // Save collection summary
  async saveCollectionSummary() {
    try {
      await prisma.dataCollectionRun.create({
        data: {
          source: 'REAL_API_COLLECTOR',
          dataType: 'multi-source',
          recordsCount: this.collectionStats.players + this.collectionStats.games + 
                       this.collectionStats.weather + this.collectionStats.odds + 
                       this.collectionStats.news,
          status: 'COMPLETED',
          endTime: new Date()
        }
      });
    } catch (error) {
      console.error('Error saving collection run:', error);
    }
  }
}

// Continuous collection mode
async function startContinuousCollection() {
  const collector = new RealAPIDataCollector();
  
  console.log('🔄 STARTING CONTINUOUS REAL DATA COLLECTION');
  console.log('==========================================');
  console.log('Collecting every 5 minutes...\n');

  // Initial collection
  await collector.collectAll();

  // Schedule regular collections
  setInterval(async () => {
    console.log(`\n🔄 Running scheduled collection at ${new Date().toLocaleTimeString()}...`);
    await collector.collectAll();
  }, 5 * 60 * 1000); // Every 5 minutes
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--continuous')) {
    await startContinuousCollection();
  } else {
    // Single run
    const collector = new RealAPIDataCollector();
    await collector.collectAll();
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});