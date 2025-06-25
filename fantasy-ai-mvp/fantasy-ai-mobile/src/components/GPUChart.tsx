import React, { useMemo, useEffect } from 'react';
import {
  Canvas,
  Path,
  LinearGradient,
  vec,
  useValue,
  useComputedValue,
  useTiming,
  Easing,
  Circle,
  Text,
  useFont,
  Group,
  RoundedRect,
  Shadow,
  Blur,
} from '@shopify/react-native-skia';
import { Dimensions, View, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

interface GPUChartProps {
  data: DataPoint[];
  height?: number;
  animationDuration?: number;
  showPoints?: boolean;
  showGradient?: boolean;
  lineColor?: string;
  gradientColors?: string[];
  style?: any;
}

const { width: screenWidth } = Dimensions.get('window');

export const GPUChart: React.FC<GPUChartProps> = ({
  data,
  height = 200,
  animationDuration = 1000,
  showPoints = true,
  showGradient = true,
  lineColor = colors.primary,
  gradientColors = [colors.primary + '40', 'transparent'],
  style,
}) => {
  const font = useFont(require('../assets/fonts/Inter-Regular.ttf'), 12);
  const chartWidth = screenWidth - 32;
  const chartHeight = height;
  const padding = 20;
  
  // Animation progress
  const progress = useValue(0);
  
  useEffect(() => {
    progress.current = 0;
    runTiming(progress, 1, {
      duration: animationDuration,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    });
  }, [data]);
  
  // Normalize data points
  const normalizedData = useMemo(() => {
    if (!data.length) return [];
    
    const minY = Math.min(...data.map(d => d.y));
    const maxY = Math.max(...data.map(d => d.y));
    const minX = Math.min(...data.map(d => d.x));
    const maxX = Math.max(...data.map(d => d.x));
    
    return data.map(point => ({
      ...point,
      x: padding + ((point.x - minX) / (maxX - minX)) * (chartWidth - 2 * padding),
      y: padding + (1 - (point.y - minY) / (maxY - minY)) * (chartHeight - 2 * padding),
    }));
  }, [data, chartWidth, chartHeight]);
  
  // Create animated path
  const animatedPath = useComputedValue(() => {
    const path = Path.Make();
    if (normalizedData.length === 0) return path;
    
    const currentProgress = progress.current;
    const pointsToShow = Math.floor(normalizedData.length * currentProgress);
    
    path.moveTo(normalizedData[0].x, normalizedData[0].y);
    
    for (let i = 1; i <= pointsToShow; i++) {
      const prev = normalizedData[i - 1];
      const curr = normalizedData[i];
      
      if (curr) {
        // Create smooth bezier curves
        const cp1x = prev.x + (curr.x - prev.x) / 3;
        const cp1y = prev.y;
        const cp2x = prev.x + (2 * (curr.x - prev.x)) / 3;
        const cp2y = curr.y;
        
        path.cubicTo(cp1x, cp1y, cp2x, cp2y, curr.x, curr.y);
      }
    }
    
    return path;
  }, [progress, normalizedData]);
  
  // Create gradient fill path
  const fillPath = useComputedValue(() => {
    const path = Path.Make();
    if (normalizedData.length === 0) return path;
    
    const currentProgress = progress.current;
    const pointsToShow = Math.floor(normalizedData.length * currentProgress);
    
    path.moveTo(normalizedData[0].x, chartHeight - padding);
    path.lineTo(normalizedData[0].x, normalizedData[0].y);
    
    for (let i = 1; i <= pointsToShow; i++) {
      const prev = normalizedData[i - 1];
      const curr = normalizedData[i];
      
      if (curr) {
        const cp1x = prev.x + (curr.x - prev.x) / 3;
        const cp1y = prev.y;
        const cp2x = prev.x + (2 * (curr.x - prev.x)) / 3;
        const cp2y = curr.y;
        
        path.cubicTo(cp1x, cp1y, cp2x, cp2y, curr.x, curr.y);
      }
    }
    
    if (pointsToShow > 0) {
      path.lineTo(normalizedData[Math.min(pointsToShow, normalizedData.length - 1)].x, chartHeight - padding);
    }
    path.close();
    
    return path;
  }, [progress, normalizedData, chartHeight]);
  
  return (
    <View style={[styles.container, { height }, style]}>
      <Canvas style={{ flex: 1 }}>
        {/* Background with subtle grid */}
        <RoundedRect
          x={0}
          y={0}
          width={chartWidth}
          height={chartHeight}
          r={12}
          color={colors.surface}
        >
          <Shadow dx={0} dy={4} blur={8} color="rgba(0,0,0,0.1)" />
        </RoundedRect>
        
        {/* Gradient fill */}
        {showGradient && (
          <Path path={fillPath} opacity={0.3}>
            <LinearGradient
              start={vec(0, padding)}
              end={vec(0, chartHeight - padding)}
              colors={gradientColors}
            />
          </Path>
        )}
        
        {/* Main line with glow effect */}
        <Group>
          <Path
            path={animatedPath}
            color={lineColor}
            style="stroke"
            strokeWidth={3}
            strokeCap="round"
            strokeJoin="round"
          >
            <Blur blur={4} />
          </Path>
          <Path
            path={animatedPath}
            color={lineColor}
            style="stroke"
            strokeWidth={2}
            strokeCap="round"
            strokeJoin="round"
          />
        </Group>
        
        {/* Animated points */}
        {showPoints && normalizedData.map((point, index) => {
          const pointProgress = useComputedValue(() => {
            const currentProgress = progress.current;
            const pointIndex = index / (normalizedData.length - 1);
            return currentProgress > pointIndex ? 1 : 0;
          }, [progress]);
          
          const pointScale = useComputedValue(() => {
            const scale = pointProgress.current;
            return scale * 1.2 + (1 - scale) * 0;
          }, [pointProgress]);
          
          return (
            <Group key={index} transform={[{ scale: pointScale }]}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={5}
                color={lineColor}
              >
                <Shadow dx={0} dy={2} blur={4} color={lineColor + '80'} />
              </Circle>
              <Circle
                cx={point.x}
                cy={point.y}
                r={3}
                color="#FFFFFF"
              />
            </Group>
          );
        })}
        
        {/* Value labels */}
        {font && normalizedData.map((point, index) => {
          if (index % Math.ceil(normalizedData.length / 5) !== 0) return null;
          
          const labelOpacity = useComputedValue(() => {
            const currentProgress = progress.current;
            const pointIndex = index / (normalizedData.length - 1);
            return currentProgress > pointIndex ? 1 : 0;
          }, [progress]);
          
          return (
            <Text
              key={`label-${index}`}
              x={point.x}
              y={point.y - 10}
              text={point.y.toFixed(0)}
              font={font}
              color={colors.text}
              opacity={labelOpacity}
            />
          );
        })}
      </Canvas>
    </View>
  );
};

// Helper function for timing animations
function runTiming(
  value: any,
  toValue: number,
  config: { duration: number; easing: any }
) {
  value.current = 0;
  const start = Date.now();
  const duration = config.duration;
  
  const frame = () => {
    const now = Date.now();
    const progress = Math.min((now - start) / duration, 1);
    value.current = config.easing(progress) * toValue;
    
    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  };
  
  requestAnimationFrame(frame);
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});