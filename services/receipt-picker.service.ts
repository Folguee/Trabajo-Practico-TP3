import * as ImagePicker from 'expo-image-picker';

export type PickedReceipt = {
  uri: string;
  mimeType?: string | null;
};

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.7,
  allowsEditing: false,
};

export async function pickReceiptFromLibrary(): Promise<PickedReceipt | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Necesitamos acceso a tus fotos para adjuntar una imagen.');
  }

  const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
  if (result.canceled || !result.assets[0]) return null;

  return {
    uri: result.assets[0].uri,
    mimeType: result.assets[0].mimeType,
  };
}

export async function takeReceiptPhoto(): Promise<PickedReceipt | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Necesitamos acceso a la camara para fotografiar el comprobante.');
  }

  const result = await ImagePicker.launchCameraAsync(pickerOptions);
  if (result.canceled || !result.assets[0]) return null;

  return {
    uri: result.assets[0].uri,
    mimeType: result.assets[0].mimeType,
  };
}
