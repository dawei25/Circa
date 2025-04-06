import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface IdentityHeaderProps {
  identityStatement: string;
  placeholderText?: string;
}

const IdentityHeader: React.FC<IdentityHeaderProps> = ({ 
  identityStatement, 
  placeholderText = "Set your identity in Profile" 
}) => {
  return (
    <View style={styles.identityHeader}>
      <Text style={styles.identityText}>
        {identityStatement || placeholderText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  identityHeader: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#4a69bd',
    borderRadius: 8,
    alignItems: 'center',
  },
  identityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});

export default IdentityHeader; 