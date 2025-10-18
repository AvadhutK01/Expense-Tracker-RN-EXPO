import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import tw from 'tailwind-react-native-classnames';
import Toast from 'react-native-toast-message';
import apiClient from '../axios/axiosInterceptor';
import { endpoints } from '../axios/endpoint';
import SendIntentAndroid from 'react-native-send-intent';
import { useDashboard } from '../context/DashboardContext';

const PAYTM_PACKAGE = 'net.one97.paytm';

type ExpensePaymentProps = {
  type: string;
  onBack: () => void;
  onSuccess?: () => void;
  isLoanPayment?: boolean;
};

const ExpensePayment: React.FC<ExpensePaymentProps> = ({
  type,
  onBack,
  onSuccess,
  isLoanPayment = false,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [unFilteredCategories, setUnFilteredCategories] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { showUPIScanner } = useDashboard();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get(endpoints.categoryEndpoint);
      setUnFilteredCategories(res.data.categories);
      const filtered = res.data.categories.filter(
        (c: any) => c.amount > 0 && c.name.toLowerCase() !== 'loan'
      );
      setCategories(filtered);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load categories' });
    } finally {
      setLoading(false);
    }
  };

  const launchPaytmFallback = async () => {
    try {
      await SendIntentAndroid.openApp(PAYTM_PACKAGE, {});
    } catch {
      Toast.show({ type: 'error', text1: 'Could not launch Paytm' });
    }
  };

  const handlePayment = async () => {
    const selected = categories.find((c) => c.name === selectedCategory);
    const amountNum = Number(amount);

    if (!selectedCategory || isNaN(amountNum) || amountNum <= 0) {
      Toast.show({ type: 'error', text1: 'Please enter valid category and amount' });
      return;
    }

    if (selected?.name.toLowerCase() !== 'loan' && amountNum > selected!.amount) {
      Toast.show({ type: 'error', text1: `Amount exceeds balance for ${selected?.name}` });
      return;
    }

    setSubmitting(true);
    try {
      if (isLoanPayment) {
        await apiClient.post(endpoints.payLoanEndpoint, { name: selectedCategory, amount: amountNum });
      } else {
        await apiClient.patch(endpoints.categoryEndpoint, {
          name: selectedCategory,
          amount: amountNum,
          type: selectedCategory.toLowerCase() === 'loan' ? 'add' : 'subtract',
        });
      }

      Toast.show({ type: 'success', text1: 'Payment processed successfully' });

      if (type === 'online') {
        showUPIScanner(amount, launchPaytmFallback);
        return;
      }

      if (onSuccess) setTimeout(onSuccess, 1800);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Payment failed' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity onPress={onBack} style={tw`mb-3`}>
        <Text style={tw`text-blue-500 text-sm`}>← Back</Text>
      </TouchableOpacity>

      <Text style={tw`mb-2 text-base font-semibold`}>Select Category</Text>
      <View style={tw`border border-gray-300 rounded mb-4 bg-white`}>
        <Picker
          selectedValue={selectedCategory}
          onValueChange={(val) => setSelectedCategory(val)}
          style={{ color: 'black', backgroundColor: 'white' }}
        >
          <Picker.Item label="Select..." value="" />
          {categories.map((cat, idx) => (
            <Picker.Item key={idx} label={`${cat.name} (₹${cat.amount})`} value={cat.name} />
          ))}
        </Picker>
      </View>

      <Text style={tw`mb-2 text-base font-semibold`}>Enter Amount</Text>
      <TextInput
        style={[tw`border border-gray-300 rounded px-3 py-2 mb-6`, { color: 'black' }]}
        keyboardType="numeric"
        placeholder="Amount"
        placeholderTextColor="#999"
        value={amount}
        onChangeText={setAmount}
      />

      <TouchableOpacity
        onPress={handlePayment}
        disabled={submitting}
        style={tw`bg-blue-600 rounded-xl py-3`}
      >
        <Text style={tw`text-center text-white font-semibold`}>
          {submitting ? 'Processing...' : 'Submit'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ExpensePayment;
