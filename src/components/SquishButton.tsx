import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export function SquishButton({ onPress, label, color = '#10b981', textColor = '#ffffff', className = '', disabled = false }: any) {
  const isPressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: withSpring(isPressed.value ? 4 : 0, { damping: 15, stiffness: 400 }) },
        { translateY: withSpring(isPressed.value ? 4 : 0, { damping: 15, stiffness: 400 }) }
      ]
    };
  });

  return (
    <Pressable
      onPressIn={() => { isPressed.value = true; }}
      onPressOut={() => { isPressed.value = false; }}
      onPress={onPress}
      disabled={disabled}
      className={`relative h-14 ${className}`}
    >
      {/* Hard Brutalist Shadow Layer */}
      <View className="absolute inset-0 bg-[#1a1a24] rounded-xl" style={{ transform: [{ translateX: 4 }, { translateY: 4 }] }} />
      
      {/* Interactive Top Layer */}
      <Animated.View 
        style={[{ backgroundColor: disabled ? '#d1d5db' : color }, animatedStyle]}
        className="absolute inset-0 rounded-xl border-2 border-[#1a1a24] items-center justify-center flex-row"
      >
        <Text style={{ color: textColor }} className="font-bebas text-2xl tracking-wider">{label}</Text>
      </Animated.View>
    </Pressable>
  );
}
