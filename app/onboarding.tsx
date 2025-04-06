import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as API from '../lib/api';
import * as validation from '../lib/validation';
import { useAuth } from '../context/auth';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

export default function OnboardingScreen() {
  const params = useLocalSearchParams();
  const isIdentityStep = params.step === 'identity';
  
  // Get auth context
  const { signIn, signUp, isLoading: authLoading, session } = useAuth();
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [identityStatement, setIdentityStatement] = useState('');
  
  // UI state
  const [isSignUp, setIsSignUp] = useState(false);
  const [showIdentityForm, setShowIdentityForm] = useState(isIdentityStep);
  const [loading, setLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [identityError, setIdentityError] = useState('');
  
  // Steps for identity creation
  const [currentStep, setCurrentStep] = useState(0);
  const identitySteps = [
    {
      title: "Who do you want to become?",
      description: "Think about the type of person you aspire to be.",
      placeholder: "I am someone who...",
      example: "Example: I am a healthy person",
    },
    {
      title: "What does this person do?",
      description: "Add specific actions or qualities to your identity.",
      placeholder: "Continue your statement...",
      example: "Example: I am a healthy person who exercises regularly and eats nutritious meals",
    },
    {
      title: "Why is this important to you?",
      description: "Make it meaningful by adding your 'why'.",
      placeholder: "Add your motivation...",
      example: "Example: I am a healthy person who exercises regularly and eats nutritious meals because I value longevity and energy",
    }
  ];

  // References for inputs
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  useEffect(() => {
    if (isIdentityStep) {
      setShowIdentityForm(true);
      setInitialCheckDone(true);
    } else {
      checkSession();
    }
  }, [isIdentityStep]);

  const checkSession = async () => {
    try {
      const { data, error } = await API.getSession();
      
      if (error) throw error;
      
      if (data?.session) {
        // Check if user has completed profile setup
        const { data: { user } } = await API.getCurrentUser();
        if (user) {
          const { data: profile, error: profileError } = await API.getProfile(user.id);
          
          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }
          
          if (!profile || !profile.identity_statement) {
            // User needs to set identity
            setShowIdentityForm(true);
          } else {
            // User is fully set up, navigate to home
            router.replace('/');
          }
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setInitialCheckDone(true);
    }
  };

  const validateEmail = () => {
    return validation.isEmail(email);
  };

  const validatePassword = () => {
    return validation.isStrongPassword(password);
  };

  const validateConfirmPassword = () => {
    return validation.matches(password, confirmPassword);
  };

  const validateIdentityStatement = () => {
    return validation.isNotEmpty(identityStatement);
  };

  const handleSignIn = async () => {
    if (!validateEmail() || !validatePassword()) {
      Alert.alert('Invalid Input', 'Please check your email and password.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        // Successfully signed in, go to home
        router.replace('/');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateEmail() || !validatePassword() || !validateConfirmPassword()) {
      Alert.alert('Invalid Input', 'Please check your inputs.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await signUp(email, password);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        // Create an empty profile immediately after signup
        if (data?.user?.id) {
          try {
            await API.updateProfile({
              id: data.user.id,
              identity_statement: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          } catch (profileError) {
            console.error('Error creating initial profile:', profileError);
          }
        }
        
        Alert.alert(
          'Success',
          'We have sent a verification link to your email. Please verify your email and sign in to continue.',
          [{ text: 'OK', onPress: () => setShowIdentityForm(false) }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIdentitySubmit = async () => {
    if (!validateIdentityStatement()) {
      Alert.alert('Invalid Input', 'Please enter a valid identity statement.');
      return;
    }

    setLoading(true);
    try {
      let userId = session?.user?.id;
      
      // If we don't have the user ID from session, try to get it from the profile
      if (!userId && session) {
        const { data: profileData } = await API.getProfile();
        userId = profileData?.id;
      }

      if (!userId) {
        throw new Error('User not found. Please sign in again.');
      }

      await API.updateProfile({
        id: userId,
        identity_statement: identityStatement,
        updated_at: new Date().toISOString(),
      });

      Alert.alert('Success', 'Your identity has been saved!', [
        { text: 'Continue', onPress: () => router.replace('/') }
      ]);
    } catch (error) {
      console.error('Error saving identity:', error);
      Alert.alert('Error', error.message || 'Failed to save identity statement');
    } finally {
      setLoading(false);
    }
  };

  const handleNextIdentityStep = () => {
    if (currentStep < identitySteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleIdentitySubmit();
    }
  };

  const handlePreviousIdentityStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!initialCheckDone || authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4a69bd" />
      </View>
    );
  }

  if (showIdentityForm) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.identityFormContainer}>
              <View style={styles.stepIndicator}>
                {identitySteps.map((_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.stepDot, 
                      currentStep >= index && styles.stepDotActive
                    ]} 
                  />
                ))}
              </View>

              <Text style={styles.title}>{identitySteps[currentStep].title}</Text>
              <Text style={styles.subtitle}>{identitySteps[currentStep].description}</Text>
              
              <View style={styles.formGroup}>
                <TextInput
                  style={[styles.input, styles.textArea, identityError ? styles.inputError : null]}
                  value={identityStatement}
                  onChangeText={setIdentityStatement}
                  placeholder={identitySteps[currentStep].placeholder}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {identityError ? (
                  <Text style={styles.errorText}>{identityError}</Text>
                ) : (
                  <Text style={styles.helpText}>{identitySteps[currentStep].example}</Text>
                )}
              </View>

              <View style={styles.stepNavigation}>
                {currentStep > 0 && (
                  <TouchableOpacity
                    style={[styles.navButton, styles.backButton]}
                    onPress={handlePreviousIdentityStep}
                  >
                    <Ionicons name="arrow-back" size={20} color="#495057" />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.navButton, styles.nextButton]}
                  onPress={handleNextIdentityStep}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.nextButtonText}>
                        {currentStep < identitySteps.length - 1 ? 'Next' : 'Finish'}
                      </Text>
                      {currentStep < identitySteps.length - 1 && (
                        <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                      )}
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.authContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>Circa</Text>
              <Text style={styles.tagline}>Identity-Based Habit Tracker</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, emailError ? styles.inputContainerError : null]}>
                <Ionicons name="mail-outline" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                  }}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, passwordError ? styles.inputContainerError : null]}>
                <Ionicons name="lock-closed-outline" size={20} color="#6c757d" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                  }}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.visibilityIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6c757d" />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            {isSignUp && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputContainer, confirmPasswordError ? styles.inputContainerError : null]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6c757d" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                    }}
                    placeholder="Confirm your password"
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity 
                    style={styles.visibilityIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6c757d" />
                  </TouchableOpacity>
                </View>
                {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={isSignUp ? handleSignUp : handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setEmailError('');
                setPasswordError('');
                setConfirmPasswordError('');
              }}
            >
              <Text style={styles.switchButtonText}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#4a69bd',
  },
  tagline: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 8,
  },
  identityFormContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212529',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#6c757d',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#495057',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputContainerError: {
    borderColor: '#dc3545',
  },
  inputIcon: {
    padding: 12,
  },
  visibilityIcon: {
    padding: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    color: '#212529',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#212529',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 4,
  },
  helpText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#4a69bd',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#4a69bd',
    fontSize: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e9ecef',
    marginHorizontal: 4,
  },
  stepDotActive: {
    backgroundColor: '#4a69bd',
  },
  stepNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: '#f1f3f5',
  },
  backButtonText: {
    marginLeft: 8,
    color: '#495057',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#4a69bd',
    marginLeft: 'auto',
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 8,
  },
}); 