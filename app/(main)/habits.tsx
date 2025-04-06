import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal,
  TextInput,
  Switch,
  ScrollView
} from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Verification method options
const VERIFICATION_METHODS = {
  MANUAL: 'manual',
  LOCATION: 'location',
  IMAGE: 'image'
};

export default function HabitsScreen() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDaily, setIsDaily] = useState(true);
  const [verificationMethod, setVerificationMethod] = useState(VERIFICATION_METHODS.MANUAL);
  const [schedule, setSchedule] = useState({
    sunday: false,
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
  });

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabit = () => {
    setEditingHabit(null);
    setTitle('');
    setDescription('');
    setIsDaily(true);
    setVerificationMethod(VERIFICATION_METHODS.MANUAL);
    setSchedule({
      sunday: false,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
    });
    setModalVisible(true);
  };

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    setTitle(habit.title);
    setDescription(habit.description || '');
    
    // Parse schedule from JSON if needed
    const habitSchedule = habit.schedule || {};
    setIsDaily(habitSchedule.daily || false);
    setVerificationMethod(habitSchedule.verification_method || VERIFICATION_METHODS.MANUAL);
    
    setSchedule({
      sunday: habitSchedule.sunday || false,
      monday: habitSchedule.monday || false,
      tuesday: habitSchedule.tuesday || false,
      wednesday: habitSchedule.wednesday || false,
      thursday: habitSchedule.thursday || false,
      friday: habitSchedule.friday || false,
      saturday: habitSchedule.saturday || false,
    });
    
    setModalVisible(true);
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);

      if (error) throw error;
      
      // Remove from local state
      setHabits(habits.filter(h => h.id !== habitId));
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const handleSaveHabit = async () => {
    try {
      if (!title.trim()) {
        alert('Please enter a habit title');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Prepare schedule data with verification method included
      const scheduleData = {
        daily: isDaily,
        ...(!isDaily && schedule),
        verification_method: verificationMethod
      };

      if (editingHabit) {
        // Update existing habit
        const { error } = await supabase
          .from('habits')
          .update({
            title,
            description,
            schedule: scheduleData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingHabit.id);

        if (error) throw error;
      } else {
        // Create new habit
        const { error } = await supabase
          .from('habits')
          .insert([
            {
              user_id: user.id,
              title,
              description,
              schedule: scheduleData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ]);

        if (error) throw error;
      }

      // Close modal and refresh habits
      setModalVisible(false);
      
      // Refresh the habits list
      await fetchHabits();
      
      // If a new habit was added for today, navigate back to today screen
      const today = new Date().getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayName = dayNames[today];
      
      const isForToday = isDaily || schedule[todayName];
      
      if (isForToday && !editingHabit) {
        // Navigate back to today tab
        router.push('/');
      }
    } catch (error) {
      console.error('Error saving habit:', error);
      alert('Error saving habit: ' + JSON.stringify(error));
    }
  };

  const toggleDay = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const renderHabitItem = ({ item }) => (
    <View style={styles.habitItem}>
      <View style={styles.habitContent}>
        <Text style={styles.habitTitle}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.habitDescription}>{item.description}</Text>
        ) : null}
        <View style={styles.habitMetaInfo}>
          <Text style={styles.scheduleText}>
            {item.schedule?.daily 
              ? 'Every day' 
              : Object.entries(item.schedule || {})
                  .filter(([key, value]) => value === true && key !== 'daily' && key !== 'verification_method')
                  .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                  .join(', ')
            }
          </Text>
          <Text style={styles.verificationText}>
            {getVerificationText(item.schedule?.verification_method)}
          </Text>
        </View>
      </View>
      <View style={styles.habitActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditHabit(item)}
        >
          <Ionicons name="create-outline" size={22} color="#4a69bd" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteHabit(item.id)}
        >
          <Ionicons name="trash-outline" size={22} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const getVerificationText = (method) => {
    switch(method) {
      case VERIFICATION_METHODS.LOCATION:
        return 'Location verification';
      case VERIFICATION_METHODS.IMAGE:
        return 'Image verification';
      case VERIFICATION_METHODS.MANUAL:
      default:
        return 'Manual verification';
    }
  };

  const renderVerificationMethodOption = (method, label, icon) => (
    <TouchableOpacity
      style={[
        styles.verificationOption,
        verificationMethod === method && styles.verificationOptionSelected
      ]}
      onPress={() => setVerificationMethod(method)}
    >
      <Ionicons 
        name={icon} 
        size={24} 
        color={verificationMethod === method ? '#fff' : '#4a69bd'} 
      />
      <Text 
        style={[
          styles.verificationOptionText,
          verificationMethod === method && styles.verificationOptionTextSelected
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Habits</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddHabit}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <Text style={styles.loadingText}>Loading habits...</Text>
      ) : habits.length > 0 ? (
        <FlatList
          data={habits}
          renderItem={renderHabitItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.habitsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No habits yet</Text>
          <Text style={styles.emptyStateSubtext}>Tap the + button to create your first habit</Text>
        </View>
      )}

      {/* Habit Edit/Create Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingHabit ? 'Edit Habit' : 'Create New Habit'}
            </Text>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter habit title"
              />

              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Schedule</Text>
              <View style={styles.scheduleOption}>
                <Text>Daily</Text>
                <Switch
                  value={isDaily}
                  onValueChange={setIsDaily}
                  trackColor={{ false: "#767577", true: "#4a69bd" }}
                />
              </View>

              {!isDaily && (
                <View style={styles.daysContainer}>
                  <Text style={styles.inputLabel}>Select Days</Text>
                  {Object.keys(schedule).map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        schedule[day] && styles.dayButtonSelected,
                      ]}
                      onPress={() => toggleDay(day)}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          schedule[day] && styles.dayButtonTextSelected,
                        ]}
                      >
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.inputLabel}>Verification Method</Text>
              <View style={styles.verificationMethods}>
                {renderVerificationMethodOption(
                  VERIFICATION_METHODS.MANUAL, 
                  'Manual', 
                  'checkmark-circle-outline'
                )}
                {renderVerificationMethodOption(
                  VERIFICATION_METHODS.LOCATION, 
                  'Location', 
                  'location-outline'
                )}
                {renderVerificationMethodOption(
                  VERIFICATION_METHODS.IMAGE, 
                  'Image', 
                  'camera-outline'
                )}
              </View>

              {verificationMethod === VERIFICATION_METHODS.LOCATION && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={20} color="#4a69bd" />
                  <Text style={styles.infoText}>
                    Location verification will check if you're at the right place when marking this habit complete.
                  </Text>
                </View>
              )}

              {verificationMethod === VERIFICATION_METHODS.IMAGE && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={20} color="#4a69bd" />
                  <Text style={styles.infoText}>
                    You'll need to upload a photo as proof when completing this habit.
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveHabit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  addButton: {
    backgroundColor: '#4a69bd',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitsList: {
    padding: 16,
  },
  habitItem: {
    flexDirection: 'row',
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
  scheduleText: {
    fontSize: 12,
    color: '#4a69bd',
    marginTop: 8,
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#6c757d',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#212529',
  },
  formContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#495057',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  scheduleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  daysContainer: {
    marginBottom: 16,
  },
  dayButton: {
    backgroundColor: '#f1f3f5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  dayButtonSelected: {
    backgroundColor: '#4a69bd',
  },
  dayButtonText: {
    color: '#495057',
  },
  dayButtonTextSelected: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f1f3f5',
  },
  cancelButtonText: {
    color: '#495057',
  },
  saveButton: {
    backgroundColor: '#4a69bd',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  habitMetaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  verificationText: {
    fontSize: 12,
    color: '#6c757d',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verificationMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  verificationOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#4a69bd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  verificationOptionSelected: {
    backgroundColor: '#4a69bd',
  },
  verificationOptionText: {
    marginTop: 4,
    fontSize: 14,
    color: '#4a69bd',
    textAlign: 'center',
  },
  verificationOptionTextSelected: {
    color: '#ffffff',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e7f5ff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: '#495057',
  },
}); 