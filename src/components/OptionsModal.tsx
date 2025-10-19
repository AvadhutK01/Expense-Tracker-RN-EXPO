import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  KeyboardEvent,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import tw from 'tailwind-react-native-classnames';
import OptionSection from './OptionSection';
import CategorySetup from '../pages/CategorySetup';
import ExpensePayment from '../pages/ExpensePayment';
import Toast from 'react-native-toast-message';
import { useDashboard } from '../context/DashboardContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Mode = 'init' | 'add' | 'update' | 'expense' | 'loan' | null;
type UpdateMode = 'permanent' | 'temporary';

const OptionsModal: React.FC<Props> = ({ visible, onClose }) => {
  const [mode, setMode] = useState<Mode>(null);
  const [updateMode, setUpdateMode] = useState<UpdateMode | undefined>();
  const [expenseType, setExpenseType] = useState<'online' | 'offline' | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const { refreshDashboard } = useDashboard();

  const keyboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setMode(null);
      setUpdateMode(undefined);
      setExpenseType(null);
      setExpandedSection(null);
    }
  }, [visible]);

  const handleSuccess = () => {
    refreshDashboard();
    onClose();
  };

  const handleExpand = (label: string) => {
    setExpandedSection(prev => (prev === label ? null : label));
  };

  const renderContent = () => {
    if ((mode === 'expense' || mode === 'loan') && expenseType) {
      return (
        <ExpensePayment
          type={expenseType}
          onBack={() => {
            setMode(null);
            setUpdateMode(undefined);
          }}
          onSuccess={() => {
            setMode(null);
            setExpenseType(null);
            handleSuccess();
          }}
          isLoanPayment={mode === 'loan'}
        />
      );
    }

    if (mode && mode !== 'expense' && mode !== 'loan') {
      return (
        <CategorySetup
          setActiveSection={() => {
            setMode(null);
            setUpdateMode(undefined);
          }}
          mode={mode}
          updateMode={mode === 'update' ? updateMode : undefined}
          onSuccess={() => {
            setMode(null);
            setUpdateMode(undefined);
            handleSuccess();
          }}
        />
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <OptionSection
          label="Initiate Setup"
          onSelect={() => setMode('init')}
          expanded={expandedSection === 'Initiate Setup'}
          onExpand={handleExpand}
        />
        <OptionSection
          label="Add New Categories"
          onSelect={() => setMode('add')}
          expanded={expandedSection === 'Add New Categories'}
          onExpand={handleExpand}
        />
        <OptionSection
          label="Update Categories"
          childrenItems={['Recurring', 'Temporary']}
          onChildSelect={(label) => {
            setMode('update');
            setUpdateMode(label.toLowerCase() === 'recurring' ? 'permanent' : 'temporary');
          }}
          expanded={expandedSection === 'Update Categories'}
          onExpand={handleExpand}
        />
        <OptionSection
          label="Pay Expenses"
          childrenItems={['Online', 'Offline']}
          onChildSelect={(label) => {
            setMode('expense');
            setExpenseType(label.toLowerCase() as 'online' | 'offline');
          }}
          expanded={expandedSection === 'Pay Expenses'}
          onExpand={handleExpand}
        />
        <OptionSection
          label="Pay Loan"
          childrenItems={['Online', 'Offline']}
          onChildSelect={(label) => {
            setMode('loan');
            setExpenseType(label.toLowerCase() as 'online' | 'offline');
          }}
          expanded={expandedSection === 'Pay Loan'}
          onExpand={handleExpand}
        />
      </ScrollView>
    );
  };

  const getTitle = () => {
    if (!mode) return 'Manage Categories';
    if (mode === 'update') {
      return updateMode === 'permanent' ? 'Update Recurring Categories' : 'Update Temporary Categories';
    }
    if ((mode === 'expense' || mode === 'loan') && expenseType) {
      return `${mode === 'expense' ? 'Pay Expense' : 'Pay Loan'} ${expenseType === 'online' ? 'Online' : 'Offline'}`;
    }
    if (mode === 'init') return 'Initiate Setup';
    return 'Add New Categories';
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropTransitionInTiming={300}
      backdropTransitionOutTiming={500}
      animationInTiming={400}
      animationOutTiming={500}
      useNativeDriver={true}
      hideModalContentWhileAnimating={true}
      style={{ margin: 0, justifyContent: 'flex-end' }}
      backdropOpacity={0.3}
    >
      <Toast visibilityTime={1500} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <Animated.View
          style={[
            tw`bg-white rounded-t-3xl px-5 pt-5 pb-8 shadow-lg`,
            { marginBottom: keyboardHeight },
          ]}
        >
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-xl font-bold text-gray-900`}>{getTitle()}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={26} color="gray" />
            </TouchableOpacity>
          </View>

          {renderContent()}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default OptionsModal;
