import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import WatchConnectivity from 'react-native-watch-connectivity';
import { useStore } from '../store';
import { WatchData } from '../types';

export function useWatchConnectivity() {
  const [isWatchReachable, setIsWatchReachable] = useState(false);
  const [isPaired, setIsPaired] = useState(false);
  const { activeLineup, activeLeague } = useStore();

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    // Initialize watch connectivity
    initializeWatch();

    // Subscribe to watch events
    const reachabilitySubscription = WatchConnectivity.subscribeToWatchReachability(
      (reachable) => setIsWatchReachable(reachable)
    );

    const messageSubscription = WatchConnectivity.subscribeToMessages(
      handleWatchMessage
    );

    return () => {
      reachabilitySubscription();
      messageSubscription();
    };
  }, []);

  const initializeWatch = async () => {
    try {
      const paired = await WatchConnectivity.getIsPaired();
      setIsPaired(paired);

      if (paired) {
        const reachable = await WatchConnectivity.getIsWatchAppInstalled();
        setIsWatchReachable(reachable);
      }
    } catch (error) {
      console.error('Watch initialization error:', error);
    }
  };

  const handleWatchMessage = (message: any, reply?: (response: any) => void) => {
    console.log('Watch message:', message);

    switch (message.type) {
      case 'getLineup':
        if (reply && activeLineup) {
          reply({
            lineup: activeLineup.starters.map(slot => ({
              position: slot.position,
              playerName: slot.player?.name || 'Empty',
              projectedPoints: slot.projectedPoints,
            })),
            totalProjected: activeLineup.totalProjectedPoints,
          });
        }
        break;

      case 'getScores':
        if (reply) {
          reply({
            myScore: 85.2,
            opponentScore: 78.4,
            timeRemaining: '2:34 Q4',
          });
        }
        break;

      case 'performAction':
        handleWatchAction(message.action);
        break;
    }
  };

  const handleWatchAction = (action: string) => {
    switch (action) {
      case 'optimizeLineup':
        // Trigger lineup optimization
        console.log('Optimize lineup from watch');
        break;
      case 'viewScores':
        // Navigate to scores
        console.log('View scores from watch');
        break;
    }
  };

  const sendToWatch = async (data: WatchData) => {
    if (!isWatchReachable) return;

    try {
      await WatchConnectivity.sendMessage(data);
    } catch (error) {
      console.error('Send to watch error:', error);
    }
  };

  const updateWatchContext = async () => {
    if (!isPaired) return;

    try {
      const context = {
        leagueName: activeLeague?.name,
        week: activeLeague?.currentWeek,
        totalProjected: activeLineup?.totalProjectedPoints,
        lastUpdate: new Date().toISOString(),
      };

      await WatchConnectivity.updateApplicationContext(context);
    } catch (error) {
      console.error('Update watch context error:', error);
    }
  };

  const sendWatchComplication = async (data: any) => {
    if (!isPaired) return;

    try {
      await WatchConnectivity.transferCurrentComplicationUserInfo({
        score: '85.2 - 78.4',
        status: 'Winning',
        lastUpdate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Watch complication error:', error);
    }
  };

  return {
    isWatchReachable,
    isPaired,
    sendToWatch,
    updateWatchContext,
    sendWatchComplication,
  };
}