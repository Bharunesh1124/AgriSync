import React from 'react';
import { ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

export function GlassPill({ children, className = '', ...props }: ViewProps) {
  return (
    <BlurView 
      intensity={75} 
      tint="light" 
      className={`border border-white/80 shadow-sm rounded-full overflow-hidden ${className}`}
      {...props as any}
    >
      {children}
    </BlurView>
  );
}
