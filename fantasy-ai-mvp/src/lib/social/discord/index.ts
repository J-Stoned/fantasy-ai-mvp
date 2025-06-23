/**
 * Discord Integration
 * Bot for league communication and real-time updates
 */

import { Client, GatewayIntentBits, TextChannel, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { SocialPost } from '../types';

export class DiscordIntegration {
  private client: Client;
  private isReady = false;
  private leagueChannels: Map<string, string> = new Map(); // leagueId -> channelId

  constructor(token: string) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ]
    });

    this.setupEventHandlers();
    this.client.login(token);
  }

  private setupEventHandlers() {
    this.client.on('ready', () => {
      console.log(`Discord bot logged in as ${this.client.user?.tag}`);
      this.isReady = true;
      this.registerSlashCommands();
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      // Handle fantasy commands
      if (message.content.startsWith('!fantasy')) {
        await this.handleFantasyCommand(message);
      }
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      await this.handleSlashCommand(interaction);
    });
  }

  /**
   * Register slash commands
   */
  private async registerSlashCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName('lineup')
        .setDescription('Get optimal lineup suggestions'),
      
      new SlashCommandBuilder()
        .setName('player')
        .setDescription('Get player information')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Player name')
            .setRequired(true)
        ),
      
      new SlashCommandBuilder()
        .setName('trade')
        .setDescription('Analyze a trade')
        .addStringOption(option =>
          option.setName('give')
            .setDescription('Players you\'re giving')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('receive')
            .setDescription('Players you\'re receiving')
            .setRequired(true)
        ),
      
      new SlashCommandBuilder()
        .setName('standings')
        .setDescription('Get current league standings'),
      
      new SlashCommandBuilder()
        .setName('injuries')
        .setDescription('Get latest injury updates')
    ];

    try {
      await this.client.application?.commands.set(commands);
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  }

  /**
   * Handle slash commands
   */
  private async handleSlashCommand(interaction: any) {
    await interaction.deferReply();

    try {
      switch (interaction.commandName) {
        case 'lineup':
          await this.sendLineupSuggestions(interaction);
          break;
        case 'player':
          await this.sendPlayerInfo(interaction);
          break;
        case 'trade':
          await this.analyzeTrade(interaction);
          break;
        case 'standings':
          await this.sendStandings(interaction);
          break;
        case 'injuries':
          await this.sendInjuryUpdates(interaction);
          break;
      }
    } catch (error) {
      console.error('Slash command error:', error);
      await interaction.editReply('Sorry, an error occurred processing your command.');
    }
  }

  /**
   * Send player update to Discord channel
   */
  async sendPlayerUpdate(
    channelId: string,
    player: {
      name: string;
      team: string;
      position: string;
      update: string;
      severity?: 'info' | 'warning' | 'critical';
    }
  ) {
    if (!this.isReady) return;

    try {
      const channel = this.client.channels.cache.get(channelId) as TextChannel;
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle(`${player.name} Update`)
        .setDescription(player.update)
        .addFields(
          { name: 'Team', value: player.team, inline: true },
          { name: 'Position', value: player.position, inline: true }
        )
        .setTimestamp()
        .setColor(
          player.severity === 'critical' ? 0xff0000 :
          player.severity === 'warning' ? 0xffaa00 :
          0x00ff00
        );

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Discord send error:', error);
    }
  }

  /**
   * Send league notification
   */
  async sendLeagueNotification(
    leagueId: string,
    notification: {
      title: string;
      message: string;
      type: 'trade' | 'waiver' | 'score' | 'general';
      data?: any;
    }
  ) {
    const channelId = this.leagueChannels.get(leagueId);
    if (!channelId || !this.isReady) return;

    try {
      const channel = this.client.channels.cache.get(channelId) as TextChannel;
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle(notification.title)
        .setDescription(notification.message)
        .setTimestamp()
        .setColor(this.getColorForType(notification.type));

      if (notification.data) {
        Object.entries(notification.data).forEach(([key, value]) => {
          embed.addFields({ name: key, value: String(value), inline: true });
        });
      }

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('League notification error:', error);
    }
  }

  /**
   * Create a dedicated channel for a league
   */
  async createLeagueChannel(
    guildId: string,
    leagueId: string,
    leagueName: string
  ): Promise<string | null> {
    if (!this.isReady) return null;

    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) return null;

      const channel = await guild.channels.create({
        name: `league-${leagueName.toLowerCase().replace(/\s+/g, '-')}`,
        type: 0, // Text channel
        topic: `Fantasy league: ${leagueName} (ID: ${leagueId})`
      });

      this.leagueChannels.set(leagueId, channel.id);
      return channel.id;
    } catch (error) {
      console.error('Create channel error:', error);
      return null;
    }
  }

  /**
   * Send lineup suggestions
   */
  private async sendLineupSuggestions(interaction: any) {
    // This would integrate with your lineup optimization service
    const embed = new EmbedBuilder()
      .setTitle('Optimal Lineup Suggestions')
      .setDescription('Based on current projections and matchups')
      .addFields(
        { name: 'QB', value: 'Patrick Mahomes (vs DEN)', inline: true },
        { name: 'RB1', value: 'Christian McCaffrey (vs SEA)', inline: true },
        { name: 'RB2', value: 'Derrick Henry (vs HOU)', inline: true },
        { name: 'WR1', value: 'Tyreek Hill (vs NE)', inline: true },
        { name: 'WR2', value: 'CeeDee Lamb (vs NYG)', inline: true },
        { name: 'TE', value: 'Travis Kelce (vs DEN)', inline: true },
        { name: 'FLEX', value: 'Davante Adams (vs LAC)', inline: true },
        { name: 'DST', value: 'San Francisco 49ers', inline: true },
        { name: 'K', value: 'Justin Tucker', inline: true }
      )
      .setColor(0x00ff00)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  /**
   * Send player information
   */
  private async sendPlayerInfo(interaction: any) {
    const playerName = interaction.options.getString('name');
    
    // This would integrate with your player data service
    const embed = new EmbedBuilder()
      .setTitle(playerName)
      .setDescription('RB - San Francisco 49ers')
      .addFields(
        { name: 'Season Stats', value: '1,234 rushing yards, 15 TDs', inline: true },
        { name: 'Avg Points', value: '22.5 PPG', inline: true },
        { name: 'Injury Status', value: 'Healthy', inline: true },
        { name: 'Next Matchup', value: 'vs SEA (25th vs RB)', inline: true },
        { name: 'Projection', value: '24.5 points', inline: true },
        { name: 'Start %', value: '98%', inline: true }
      )
      .setColor(0x00aa00)
      .setThumbnail('https://example.com/player-image.jpg')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  /**
   * Analyze trade
   */
  private async analyzeTrade(interaction: any) {
    const giving = interaction.options.getString('give');
    const receiving = interaction.options.getString('receive');

    // This would integrate with your trade analysis service
    const embed = new EmbedBuilder()
      .setTitle('Trade Analysis')
      .setDescription(`Analyzing: ${giving} for ${receiving}`)
      .addFields(
        { name: 'Trade Grade', value: 'B+', inline: true },
        { name: 'Value Change', value: '+12.5%', inline: true },
        { name: 'Recommendation', value: 'Accept', inline: true },
        { name: 'Analysis', value: 'You\'re getting good value here. The player you\'re receiving has a better playoff schedule and higher upside.' }
      )
      .setColor(0x0099ff)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  /**
   * Send standings
   */
  private async sendStandings(interaction: any) {
    // This would integrate with your league data service
    const embed = new EmbedBuilder()
      .setTitle('League Standings')
      .setDescription('Current standings for your league')
      .addFields(
        { name: '1st', value: 'Team Alpha (8-2)', inline: true },
        { name: '2nd', value: 'Team Beta (7-3)', inline: true },
        { name: '3rd', value: 'Your Team (6-4)', inline: true },
        { name: '4th', value: 'Team Delta (6-4)', inline: true },
        { name: '5th', value: 'Team Echo (5-5)', inline: true },
        { name: '6th', value: 'Team Foxtrot (4-6)', inline: true }
      )
      .setColor(0x9932cc)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  /**
   * Send injury updates
   */
  private async sendInjuryUpdates(interaction: any) {
    // This would integrate with your injury tracking service
    const embed = new EmbedBuilder()
      .setTitle('Latest Injury Updates')
      .setDescription('Key injuries affecting fantasy football')
      .addFields(
        { name: '🚨 OUT', value: 'Player A (ankle)\nPlayer B (hamstring)', inline: true },
        { name: '⚠️ QUESTIONABLE', value: 'Player C (knee)\nPlayer D (shoulder)', inline: true },
        { name: '✅ PROBABLE', value: 'Player E (rest)\nPlayer F (illness)', inline: true }
      )
      .setColor(0xff0000)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  /**
   * Get color for notification type
   */
  private getColorForType(type: string): number {
    switch (type) {
      case 'trade': return 0x0099ff;
      case 'waiver': return 0x00ff00;
      case 'score': return 0xff9900;
      default: return 0x9932cc;
    }
  }

  /**
   * Handle fantasy commands
   */
  private async handleFantasyCommand(message: any) {
    const args = message.content.slice(8).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    switch (command) {
      case 'help':
        await message.reply('Available commands: !fantasy lineup, !fantasy player [name], !fantasy trade, !fantasy standings');
        break;
      // Add more command handlers
    }
  }
}

// Singleton instance
let discordInstance: DiscordIntegration | null = null;

export function getDiscordIntegration(): DiscordIntegration {
  if (!discordInstance) {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      throw new Error('Discord bot token not configured');
    }
    discordInstance = new DiscordIntegration(token);
  }
  return discordInstance;
}