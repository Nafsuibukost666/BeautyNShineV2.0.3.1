/**
 * ErrorBoundary — catches render errors and shows them
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error.message, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={{ flex: 1, backgroundColor: '#0a0e1a', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 16, color: '#ef4444', fontWeight: '700', marginBottom: 8 }}>❌ Render Error</Text>
          <Text style={{ fontSize: 14, color: '#f0f2f8', textAlign: 'center', fontFamily: 'monospace' }}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
          <Text style={{ fontSize: 11, color: '#5a6180', marginTop: 12, textAlign: 'center', fontFamily: 'monospace' }}>
            {this.state.error?.stack?.split('\n').slice(0, 4).join('\n') || ''}
          </Text>
          <TouchableOpacity
            style={{ marginTop: 20, backgroundColor: '#1e2640', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
            onPress={() => this.setState({ hasError: false, error: null })}>
            <Text style={{ color: '#f0a070', fontWeight: '600' }}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
