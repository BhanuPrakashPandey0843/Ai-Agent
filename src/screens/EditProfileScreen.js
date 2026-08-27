import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput as RNTextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import ScreenContainer from '../components/common/ScreenContainer';
import GradientButton from '../components/common/GradientButton';
import { CLOUDINARY_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET } from '../config/firebase';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, userProfile, updateUserProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: userProfile?.name || '',
    email: user?.email || userProfile?.email || '',
    address: userProfile?.address || '',
    photoURL: userProfile?.photoURL || '',
  });
  const [tempImage, setTempImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Copies the picked asset into the app's own cache directory before we
  // ever touch it again. This matters on Android: expo-image-picker often
  // returns a content:// URI (pointing at the system Photos provider)
  // rather than a plain file:// path. Handing that content:// URI straight
  // to fetch()/FormData for the Cloudinary upload is unreliable across
  // Android versions/OEM gallery providers and is the most common cause of
  // "failed to update profile picture" errors that only show up on Android.
  // Copying to FileSystem.cacheDirectory first guarantees a real file:// URI
  // that both <Image> and the upload can read consistently.
  const cacheLocalCopy = useCallback(async (asset) => {
    const sourceUri = asset.uri;
    if (sourceUri.startsWith('file://')) {
      // Already a local file (typical on iOS) - no copy needed.
      return sourceUri;
    }
    const extGuess = (asset.fileName || sourceUri).split('.').pop().split('?')[0];
    const ext = /^[a-zA-Z0-9]{2,4}$/.test(extGuess) ? extGuess.toLowerCase() : 'jpg';
    const destUri = `${FileSystem.cacheDirectory}profile_${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return destUri;
  }, []);

  const handleImagePick = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'We need access to your photos to set a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setUploading(true);
        try {
          const localUri = await cacheLocalCopy(result.assets[0]);
          setTempImage(localUri);
        } catch (copyErr) {
          console.warn('[EditProfile] Failed to cache picked image locally:', copyErr);
          // Fall back to the original asset URI rather than blocking the user -
          // on iOS this path is already a file:// URI and works fine anyway.
          setTempImage(result.assets[0].uri);
        } finally {
          setUploading(false);
        }
      }
    } catch (err) {
      console.warn('[EditProfile] Image pick failed:', err);
      showToast('Failed to pick image. Please try again.', 'error');
    }
  }, [showToast, cacheLocalCopy]);

  const uploadImageToCloudinary = async (uri) => {
    const formData = new FormData();
    const fileName = uri.split('/').pop() || `profile_${Date.now()}.jpg`;
    const extMatch = fileName.split('.').pop();
    const fileType = /^[a-zA-Z0-9]{2,4}$/.test(extMatch) ? extMatch.toLowerCase() : 'jpg';

    formData.append('file', {
      uri,
      name: fileName,
      type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'profile_pictures');

    // Guard against the request hanging forever on a poor connection -
    // without this, "Saving..." could spin indefinitely with no error ever
    // surfaced to the user.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch (networkErr) {
      if (networkErr.name === 'AbortError') {
        throw new Error('Upload timed out. Check your connection and try again.');
      }
      throw new Error('Network error while uploading image. Check your connection and try again.');
    } finally {
      clearTimeout(timeoutId);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('Upload server returned an unexpected response.');
    }

    if (!response.ok || !data.secure_url) {
      // Cloudinary returns a descriptive message (e.g. an unsigned upload
      // preset that doesn't exist/isn't enabled) in data.error.message -
      // surface it directly instead of a generic failure so this is
      // diagnosable from the toast alone.
      throw new Error(data.error?.message || `Upload failed (${response.status})`);
    }
    return data.secure_url;
  };

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    try {
      setLoading(true);
      let photoURL = form.photoURL;

      if (tempImage) {
        setUploading(true);
        try {
          photoURL = await uploadImageToCloudinary(tempImage);
        } catch (uploadErr) {
          // Surface the specific reason (network/timeout/Cloudinary config) and
          // stop here - tempImage is left untouched so the preview the user
          // already sees doesn't disappear and they can just tap Save again
          // once the underlying issue (e.g. connectivity) is resolved.
          console.warn('[EditProfile] Image upload failed:', uploadErr);
          showToast(uploadErr.message || 'Failed to upload image', 'error');
          return;
        } finally {
          setUploading(false);
        }
      }

      const updates = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        address: form.address.trim(),
        photoURL,
      };

      const result = await updateUserProfile(updates);
      if (result?.success) {
        // Reflect the newly-persisted photo in local form state and clear the
        // temp preview so a subsequent Save (e.g. editing just the name) does
        // not re-trigger a redundant re-upload of the same image.
        setForm((prev) => ({ ...prev, photoURL }));
        setTempImage(null);
        showToast('Profile updated successfully!', 'success');
        navigation.goBack();
      } else {
        showToast(result?.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      console.warn('[EditProfile] Save failed:', err);
      showToast(err.message || 'An error occurred', 'error');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }, [form, tempImage, updateUserProfile, showToast, navigation]);

  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const cardBg = isDark ? '#101010' : '#F5F5F5';
  const borderColor = isDark ? '#2A2A44' : '#E5E7EB';

  return (
    <ScreenContainer>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={28} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: textPrimary }]}>
            Edit Profile
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={[styles.profileImageSection, { backgroundColor: cardBg }]}>
          <View style={styles.avatarWrapper}>
            {tempImage || form.photoURL ? (
              <Image
                source={{ uri: tempImage || form.photoURL }}
                style={styles.avatar}
              />
            ) : (
              <LinearGradient
                colors={[colors.primary, '#FF9A33']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {(form.name || user?.email || 'U')[0].toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            <TouchableOpacity
              style={[styles.cameraButton, { backgroundColor: colors.primary }]}
              onPress={handleImagePick}
              disabled={loading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.changePhotoText, { color: colors.primary }]}>
            Tap to change photo
          </Text>
        </View>

        <View style={[styles.formSection, { backgroundColor: cardBg }]}>
          <View style={[styles.inputContainer, { borderBottomColor: borderColor }]}>
            <Ionicons name="person-outline" size={20} color={textSecondary} />
            <Text style={[styles.label, { color: textSecondary }]}>Full Name</Text>
          </View>
          <View style={[styles.inputWrapper, { borderBottomColor: borderColor }]}>
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              placeholder="Enter your full name"
              placeholderTextColor={textSecondary}
              editable={!loading}
            />
          </View>

          <View style={[styles.inputContainer, { borderBottomColor: borderColor }]}>
            <Ionicons name="mail-outline" size={20} color={textSecondary} />
            <Text style={[styles.label, { color: textSecondary }]}>Email Address</Text>
          </View>
          <View style={[styles.inputWrapper, { borderBottomColor: borderColor }]}>
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              placeholder="Enter your email address"
              placeholderTextColor={textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={[styles.inputContainer, { borderBottomColor: borderColor }]}>
            <Ionicons name="location-outline" size={20} color={textSecondary} />
            <Text style={[styles.label, { color: textSecondary }]}>Address</Text>
          </View>
          <View style={[styles.inputWrapper, { borderBottomColor: 'transparent' }]}>
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              value={form.address}
              onChangeText={(text) => setForm({ ...form, address: text })}
              placeholder="Enter your address"
              placeholderTextColor={textSecondary}
              multiline
              numberOfLines={3}
              editable={!loading}
            />
          </View>
        </View>

        <GradientButton
          title={loading ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          disabled={loading}
          style={styles.saveButton}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

function TextInput({ style, ...props }) {
  return <RNTextInput style={[style, styles.textInput]} {...props} />;
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  profileImageSection: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    marginTop: 8,
  },
  textInput: {
    width: '100%',
  },
});
