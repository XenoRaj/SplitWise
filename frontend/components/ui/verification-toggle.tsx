import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type VerificationStatus = 'accepted' | 'pending' | 'rejected';

interface VerificationToggleProps {
  value: VerificationStatus;
  onChange: (status: VerificationStatus) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const VerificationToggle: React.FC<VerificationToggleProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'medium',
}) => {
  const options: { status: VerificationStatus; label: string; color: string }[] = [
    { status: 'accepted', label: '✓', color: '#10B981' }, // Green
    { status: 'pending', label: '⏳', color: '#F59E0B' }, // Orange
    { status: 'rejected', label: '✗', color: '#EF4444' }, // Red
  ];

  const getContainerStyle = () => {
    const baseStyle = styles.container;
    const sizeStyle = styles[`container${size.charAt(0).toUpperCase() + size.slice(1)}`];
    return [baseStyle, sizeStyle, disabled && styles.disabled];
  };

  const getOptionStyle = (isSelected: boolean, optionColor: string) => {
    const baseStyle = styles.option;
    const sizeStyle = styles[`option${size.charAt(0).toUpperCase() + size.slice(1)}`];
    return [
      baseStyle,
      sizeStyle,
      isSelected && { backgroundColor: optionColor },
      !isSelected && styles.optionInactive,
      disabled && styles.optionDisabled,
    ];
  };

  const getTextStyle = (isSelected: boolean) => {
    const baseStyle = styles.optionText;
    const sizeStyle = styles[`optionText${size.charAt(0).toUpperCase() + size.slice(1)}`];
    return [
      baseStyle,
      sizeStyle,
      isSelected && styles.optionTextSelected,
      disabled && styles.optionTextDisabled,
    ];
  };

  return (
    <View style={getContainerStyle()}>
      {options.map((option) => {
        const isSelected = value === option.status;
        return (
          <TouchableOpacity
            key={option.status}
            style={getOptionStyle(isSelected, option.color)}
            onPress={() => !disabled && onChange(option.status)}
            activeOpacity={disabled ? 1 : 0.7}
          >
            <Text style={getTextStyle(isSelected)}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    padding: 2,
    // keep toggle compact by default
    alignSelf: 'flex-start',
  },
  containerSmall: {
    borderRadius: 6,
    padding: 1,
  },
  containerMedium: {
    borderRadius: 8,
    padding: 2,
  },
  containerLarge: {
    borderRadius: 10,
    padding: 3,
  },
  disabled: {
    opacity: 0.6,
  },
  option: {
    // do not stretch to fill parent; keep compact
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  optionSmall: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
    minWidth: 28,
    minHeight: 28,
  },
  optionMedium: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 40,
    minHeight: 36,
  },
  optionLarge: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 52,
    minHeight: 44,
  },
  optionInactive: {
    backgroundColor: 'transparent',
  },
  optionDisabled: {
    backgroundColor: '#E5E7EB',
  },
  optionText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  optionTextSmall: {
    fontSize: 10,
  },
  optionTextMedium: {
    fontSize: 14,
  },
  optionTextLarge: {
    fontSize: 16,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  optionTextDisabled: {
    color: '#9CA3AF',
  },
});

export default VerificationToggle;