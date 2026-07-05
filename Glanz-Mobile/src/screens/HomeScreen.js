import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={s.root}>
      <Text style={s.title}>Home</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0d0d', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#d4a840', fontSize: 24, fontWeight: '800' },
});
