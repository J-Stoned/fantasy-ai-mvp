import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import * as Sentry from '@sentry/react-native';

interface PerformanceMetrics {
  screenName: string;
  renderTime?: number;
  interactionTime?: number;
  apiCallTime?: number;
  customMetrics?: Record<string, number>;
}

export function usePerformanceMonitor(screenName: string) {
  const mountTime = useRef<number>(Date.now());
  const transaction = useRef<any>(null);
  const metrics = useRef<PerformanceMetrics>({ screenName });

  useEffect(() => {
    // Start transaction
    transaction.current = Sentry.startTransaction({
      name: `screen.${screenName}`,
      op: 'navigation',
    });

    // Measure time to interactive
    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      const interactionTime = Date.now() - mountTime.current;
      metrics.current.interactionTime = interactionTime;
      
      transaction.current?.setMeasurement('time_to_interactive', interactionTime, 'millisecond');
      
      if (__DEV__) {
        console.log(`[Performance] ${screenName} interactive in ${interactionTime}ms`);
      }
    });

    // Cleanup
    return () => {
      if (transaction.current) {
        const totalTime = Date.now() - mountTime.current;
        transaction.current.setMeasurement('total_render_time', totalTime, 'millisecond');
        transaction.current.finish();
      }
      
      interactionHandle.cancel();
    };
  }, [screenName]);

  const measureApiCall = async <T,>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = Date.now();
    const span = transaction.current?.startChild({
      op: 'http',
      description: apiName,
    });

    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      span?.setMeasurement('http.response_time', duration, 'millisecond');
      span?.setStatus('ok');
      
      if (__DEV__) {
        console.log(`[Performance] API ${apiName} completed in ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      span?.setStatus('internal_error');
      throw error;
    } finally {
      span?.finish();
    }
  };

  const measureCustom = (metricName: string, value: number, unit: string = 'millisecond') => {
    transaction.current?.setMeasurement(metricName, value, unit);
    
    if (!metrics.current.customMetrics) {
      metrics.current.customMetrics = {};
    }
    metrics.current.customMetrics[metricName] = value;
    
    if (__DEV__) {
      console.log(`[Performance] ${screenName} - ${metricName}: ${value}${unit}`);
    }
  };

  return {
    measureApiCall,
    measureCustom,
    metrics: metrics.current,
  };
}

// Hook for measuring list performance
export function useListPerformanceMonitor(listName: string) {
  const renderTimes = useRef<number[]>([]);
  const scrollMetrics = useRef({
    scrollCount: 0,
    maxScrollSpeed: 0,
    totalScrollDistance: 0,
  });

  const measureItemRender = (index: number) => {
    const renderTime = Date.now();
    renderTimes.current[index] = renderTime;
    
    // Calculate average render time for first 10 items
    if (index === 9) {
      const firstTenRenderTime = renderTimes.current[9] - renderTimes.current[0];
      if (__DEV__) {
        console.log(`[Performance] ${listName} - First 10 items rendered in ${firstTenRenderTime}ms`);
      }
      
      Sentry.addBreadcrumb({
        message: `List ${listName} initial render`,
        level: 'info',
        data: {
          renderTime: firstTenRenderTime,
          itemCount: 10,
        },
      });
    }
  };

  const measureScroll = (event: any) => {
    const { contentOffset, velocity } = event.nativeEvent;
    
    scrollMetrics.current.scrollCount++;
    scrollMetrics.current.totalScrollDistance += Math.abs(velocity?.y || 0);
    scrollMetrics.current.maxScrollSpeed = Math.max(
      scrollMetrics.current.maxScrollSpeed,
      Math.abs(velocity?.y || 0)
    );
  };

  const reportMetrics = () => {
    if (scrollMetrics.current.scrollCount > 0) {
      const avgScrollSpeed = scrollMetrics.current.totalScrollDistance / scrollMetrics.current.scrollCount;
      
      Sentry.addBreadcrumb({
        message: `List ${listName} scroll metrics`,
        level: 'info',
        data: {
          scrollCount: scrollMetrics.current.scrollCount,
          avgScrollSpeed,
          maxScrollSpeed: scrollMetrics.current.maxScrollSpeed,
        },
      });
    }
  };

  useEffect(() => {
    return () => {
      reportMetrics();
    };
  }, []);

  return {
    measureItemRender,
    measureScroll,
  };
}