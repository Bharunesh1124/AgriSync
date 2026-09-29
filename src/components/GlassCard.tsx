import React from 'react';
import { ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface GlassCardProps extends ViewProps {
  delay?: number;
}

export function GlassCard({ children, className = '', delay = 0, ...props }: GlassCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(15).mass(0.8)}>
      <BlurView 
        intensity={45} 
        tint="light" 
        className={`border border-white/65 shadow-sm rounded-[24px] overflow-hidden ${className}`}
        {...props as any}
      >
        {children}
      </BlurView>
    </Animated.View>
  );
}
