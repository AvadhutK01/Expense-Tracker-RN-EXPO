import React from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'tailwind-react-native-classnames';

interface OptionSectionProps {
  label: string;
  childrenItems?: string[];
  onSelect?: () => void;
  onChildSelect?: (label: string) => void;
  expanded: boolean;
  onExpand: (label: string) => void;
}

const OptionSection: React.FC<OptionSectionProps> = ({
  label,
  childrenItems,
  onSelect,
  onChildSelect,
  expanded,
  onExpand
}) => {
  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (childrenItems) {
      onExpand(label);
    } else {
      onSelect?.();
    }
  };

  return (
    <View style={tw`mb-1`}>
      <TouchableOpacity
        style={tw`flex-row justify-between items-center py-4`}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={tw`text-base text-gray-800`}>{label}</Text>
        {childrenItems && (
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="gray"
          />
        )}
      </TouchableOpacity>

      <View>
        {expanded &&
          childrenItems?.map((child, index) => (
            <TouchableOpacity key={index} style={tw`pl-6 py-2`} onPress={() => onChildSelect?.(child)}>
              <Text style={tw`text-sm text-gray-600`}>• {child}</Text>
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );
};

export default OptionSection;
