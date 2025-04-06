import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

// Verification method options
const VERIFICATION_METHODS = {
  MANUAL: 'manual',
  LOCATION: 'location',
  IMAGE: 'image'
};

interface HabitItemProps {
  habit: {
    id: string | number;
    title: string;
    description?: string;
    completed?: boolean;
    schedule?: {
      daily?: boolean;
      sunday?: boolean;
      monday?: boolean;
      tuesday?: boolean;
      wednesday?: boolean;
      thursday?: boolean;
      friday?: boolean;
      saturday?: boolean;
      verification_method?: string;
      location_data?: {
        latitude: number;
        longitude: number;
        radius: number; // meters
      };
    };
  };
  onToggle: (habitId: string | number, verificationData?: any) => void;
}

const HabitItem: React.FC<HabitItemProps> = ({ habit, onToggle }) => {
  const [loading, setLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);

  // Get verification method from schedule
  const getVerificationMethod = () => {
    return habit.schedule?.verification_method || VERIFICATION_METHODS.MANUAL;
  };

  const handleVerification = async () => {
    const method = getVerificationMethod();
    
    switch (method) {
      case VERIFICATION_METHODS.MANUAL:
        onToggle(habit.id);
        break;
        
      case VERIFICATION_METHODS.LOCATION:
        await verifyLocation();
        break;
        
      case VERIFICATION_METHODS.IMAGE:
        await pickImage();
        break;
        
      default:
        onToggle(habit.id);
    }
  };

  const verifyLocation = async () => {
    try {
      setLoading(true);
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location verification requires location permissions.');
        return;
      }
      
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      // For this demo, we'll simulate verification by assuming any location works
      // In a real app, you would compare this to stored habit.location_data
      
      // Simulated success
      Alert.alert('Location Verified', 'Your location has been verified!');
      onToggle(habit.id, { location: location.coords });
      
    } catch (error) {
      console.error('Error verifying location:', error);
      Alert.alert('Verification Failed', 'Could not verify your location.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Image verification requires camera roll permissions.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProofImage(result.assets[0].uri);
        setShowImageModal(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select an image.');
    }
  };

  const confirmImageVerification = () => {
    onToggle(habit.id, { imageUri: proofImage });
    setShowImageModal(false);
    setProofImage(null);
  };

  const getVerificationIcon = () => {
    const method = getVerificationMethod();
    
    switch (method) {
      case VERIFICATION_METHODS.LOCATION:
        return 'location-outline';
      case VERIFICATION_METHODS.IMAGE:
        return 'camera-outline';
      default:
        return 'checkmark-circle-outline';
    }
  };
  
  return (
    <TouchableOpacity 
      style={styles.habitItem}
      onPress={handleVerification}
      activeOpacity={0.7}
      disabled={loading}
    >
      <View style={styles.habitContent}>
        <Text style={styles.habitTitle}>{habit.title}</Text>
        {habit.description ? (
          <Text style={styles.habitDescription}>{habit.description}</Text>
        ) : null}
      </View>
      
      <View style={styles.verificationContainer}>
        {loading ? (
          <View style={styles.loadingIndicator}>
            <Ionicons name="hourglass-outline" size={24} color="#6c757d" />
          </View>
        ) : habit.completed ? (
          <View style={styles.completedIndicator}>
            <Ionicons name="checkmark-circle" size={32} color="#4a69bd" />
          </View>
        ) : (
          <View style={styles.verificationButton}>
            <Ionicons name={getVerificationIcon()} size={24} color="#4a69bd" />
          </View>
        )}
      </View>
      
      {/* Image Proof Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Habit Completion</Text>
            
            {proofImage && (
              <Image source={{ uri: proofImage }} style={styles.proofImage} />
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowImageModal(false);
                  setProofImage(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmImageVerification}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  habitContent: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  habitDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  verificationContainer: {
    marginLeft: 12,
  },
  verificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4a69bd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  completedIndicator: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  proofImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f3f5',
  },
  confirmButton: {
    backgroundColor: '#4a69bd',
  },
  cancelButtonText: {
    color: '#495057',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HabitItem; 