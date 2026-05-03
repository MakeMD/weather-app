import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { getCityImage } from '../data/cityImages';

export default function CityImage({ city }) {
  const image = getCityImage(city);

  return (
    <View style={styles.imageWrapper}>
      <Image
        source={image}
        style={styles.cityImage}
        contentFit="contain"
        transition={200}
        cachePolicy="memory-disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
  },
  cityImage: { width: '100%', height: '100%' },
});