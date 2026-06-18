import { useEffect } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Svg, { Path } from 'react-native-svg';
import { loginWithGoogle, loginWithGoogleCredential } from '../services/auth.service';

WebBrowser.maybeCompleteAuthSession();

type GoogleSignInButtonProps = {
  disabled?: boolean;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  onError: (message: string) => void;
};

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" style={{ marginRight: 10 }}>
      <Path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.716 5.716 0 0 1-2.48 3.77v3.13h3.99c2.34-2.16 3.69-5.32 3.69-8.75z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.99-3.13a7.18 7.18 0 0 1-11.87-3.88H.05v3.23A11.997 11.997 0 0 0 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M4.07 14.08a7.18 7.18 0 0 1 0-4.54V6.31H.05a11.99 11.99 0 0 0 0 11.38l4.02-3.61z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.93 11.93 0 0 0 12 0 11.997 11.997 0 0 0 .05 6.31l4.02 3.61c.95-2.84 3.59-5.17 7.93-5.17z"
      />
    </Svg>
  );
}

function Separator() {
  return (
    <View className="flex-row items-center my-4 w-full">
      <View className="flex-1 h-[1px] bg-slate-200 dark:bg-gray-700" />
      <Text className="text-xs text-slate-400 dark:text-gray-500 px-3 font-medium">O continuar con</Text>
      <View className="flex-1 h-[1px] bg-slate-200 dark:bg-gray-700" />
    </View>
  );
}

function GoogleButton({
  onPress,
  disabled,
  isSubmitting,
}: {
  onPress: () => void;
  disabled?: boolean;
  isSubmitting: boolean;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center justify-center bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 active:bg-slate-50 dark:active:bg-gray-600 py-3 rounded-xl w-full disabled:opacity-50 shadow-sm"
      onPress={onPress}
      disabled={disabled}
    >
      <GoogleIcon />
      <Text className="text-slate-700 dark:text-gray-200 font-semibold text-base">
        {isSubmitting ? 'Cargando...' : 'Google'}
      </Text>
    </TouchableOpacity>
  );
}

// --- Variante WEB: usa signInWithPopup ---
function GoogleSignInWeb({ disabled, isSubmitting, setIsSubmitting, onError }: GoogleSignInButtonProps) {
  const handlePress = async () => {
    onError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      router.replace('/dashboard');
    } catch (error: any) {
      console.error(error);
      onError(
        error?.code === 'auth/popup-blocked'
          ? 'El popup de autenticación fue bloqueado por el navegador'
          : error?.message || 'Error al iniciar sesión con Google'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Separator />
      <GoogleButton onPress={handlePress} disabled={disabled} isSubmitting={isSubmitting} />
    </>
  );
}

// --- Variante MOBILE: usa expo-auth-session (solo se monta si hay Client IDs) ---
function GoogleSignInMobile({ disabled, isSubmitting, setIsSubmitting, onError }: GoogleSignInButtonProps) {
  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token;
      if (!idToken) {
        onError('No se obtuvo el token de Google.');
        setIsSubmitting(false);
        return;
      }
      loginWithGoogleCredential(idToken)
        .then(() => router.replace('/dashboard'))
        .catch((error: any) => {
          console.error(error);
          onError(error?.message || 'Error al iniciar sesión con Google');
        })
        .finally(() => setIsSubmitting(false));
    } else if (
      response?.type === 'error' ||
      response?.type === 'cancel' ||
      response?.type === 'dismiss'
    ) {
      setIsSubmitting(false);
    }
  }, [response]);

  const handlePress = async () => {
    onError('');
    setIsSubmitting(true);
    try {
      await promptAsync();
    } catch (error: any) {
      console.error(error);
      onError(error?.message || 'Error al iniciar sesión con Google');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Separator />
      <GoogleButton onPress={handlePress} disabled={disabled} isSubmitting={isSubmitting} />
    </>
  );
}

/**
 * Botón de "Iniciar sesión con Google".
 * - En web: usa el popup de Firebase (no requiere configuración extra).
 * - En mobile: usa OAuth nativo y SOLO se renderiza si están configurados los
 *   Client IDs en las variables de entorno (de lo contrario no se muestra nada,
 *   evitando que el hook lance un error y crashee el login).
 */
export default function GoogleSignInButton(props: GoogleSignInButtonProps) {
  if (Platform.OS === 'web') {
    return <GoogleSignInWeb {...props} />;
  }

  const hasMobileClientId =
    Platform.OS === 'ios'
      ? Boolean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)
      : Boolean(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID);

  if (!hasMobileClientId) {
    return null;
  }

  return <GoogleSignInMobile {...props} />;
}