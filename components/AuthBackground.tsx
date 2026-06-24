import { View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BG_IMG = require('../assets/fondo-finanzas.png');

export default function AuthBackground() {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
      }}
    >
      <Image
        source={BG_IMG}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[
          'rgba(2, 6, 23, 0.45)',
          'rgba(2, 6, 23, 0.75)',
          '#020617'
        ]}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
    </View>
  );
}