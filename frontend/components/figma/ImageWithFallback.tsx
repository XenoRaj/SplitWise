import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

interface ImageWithFallbackProps {
  source: { uri: string };
  style: any;
}

export function ImageWithFallback({ source, style }: ImageWithFallbackProps) {
  return (
    <View style={style}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
    </View>
  );
}