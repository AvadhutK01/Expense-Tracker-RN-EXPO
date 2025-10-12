import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
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

  const handleSuccess = () => {
    refreshDashboard();
    onClose();
  };

  useEffect(() => {
    if (!visible) {
      setMode(null);
      setUpdateMode(undefined);
      setExpenseType(null);
      setExpandedSection(null);
    }
  }, [visible]);

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
      <ScrollView showsVerticalScrollIndicator={false}>
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
    <>
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
        style={tw`m-0 justify-end`}
        backdropOpacity={0.3}
      >
        <Toast visibilityTime={1500} />
        <View style={tw`bg-white rounded-t-3xl px-5 pt-5 pb-8 shadow-lg`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-xl font-bold text-gray-900`}>
              {getTitle()}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={26} color="gray" />
            </TouchableOpacity>
          </View>
          {renderContent()}
        </View>
      </Modal>
    </>
  );
};

export default OptionsModal;
