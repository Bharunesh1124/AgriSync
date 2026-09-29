import React from 'react';
import { View, ViewProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface GlowGlassCardProps extends ViewProps {
  glowColor?: string;
  delay?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const GlowGlassCard: React.FC<GlowGlassCardProps> = ({
  children,
  glowColor = '#10b981',
  delay = 0,
  borderRadius = 24,
  style,
  ...props
}) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(15).mass(0.8)}
      style={[
        {
          borderRadius,
          shadowColor: glowColor,
          shadowOpacity: 0.22,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 5,
        },
        style
      ]}
      {...props}
    >
      <View style={{ borderRadius, overflow: 'hidden' }}>
        {children}
      </View>
    </Animated.View>
  );
};
