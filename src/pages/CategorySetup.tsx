import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, LayoutAnimation,
    ScrollView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'tailwind-react-native-classnames';
import apiClient from '../axios/axiosInterceptor';
import { endpoints } from '../axios/endpoint';
import Toast from 'react-native-toast-message';

interface CategoryInput {
    name: string;
    amount: string;
    isNew?: boolean;
}

interface Props {
    setActiveSection: (section: string | null) => void;
    mode: 'init' | 'add' | 'update';
    updateMode?: 'temporary' | 'permanent';
    onSuccess?: () => void;
}

const CategorySetup: React.FC<Props> = ({ setActiveSection, mode, updateMode, onSuccess }) => {
    const [categories, setCategories] = useState<CategoryInput[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (mode === 'init') {
            setCategories([
                { name: 'savings', amount: '', isNew: true },
                { name: 'loan', amount: '', isNew: true },
            ]);
            setLoading(false);
        } else {
            fetchExistingCategories();
        }
    }, []);

    const showToast = (type: 'success' | 'error', text: string) => {
        Toast.show({
            type,
            text1: text,
            position: 'top'
        });
    };

    const fetchExistingCategories = async () => {
        try {
            let res;
            if(updateMode === 'permanent'){
                res = await apiClient.get(`${endpoints.categoryEndpoint}?type=recurring`)
            }
            else{
                res = await apiClient.get(endpoints.categoryEndpoint)
            }
            const fetched = res.data.categories.map((c: any) => ({
                name: c.name,
                amount: String(c.amount),
                isNew: false,
            }));

            if (mode === 'add') {
                setCategories(fetched);
            } else if (mode === 'update') {
                const filtered = updateMode === 'permanent'
                    ? fetched.filter((c: CategoryInput) => c.name.toLowerCase() !== 'loan')
                    : fetched;
                setCategories(filtered);
            }
        } catch (err) {
            showToast('error', 'Failed to load categories.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCategories([...categories, { name: '', amount: '', isNew: true }]);
    };

    const handleRemoveRow = (index: number) => {
        const name = categories[index].name.toLowerCase();
        if (['loan', 'savings'].includes(name)) {
            showToast('error', `"${name}" category cannot be removed.`);
            return;
        }

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const updated = [...categories];
        updated.splice(index, 1);
        setCategories(updated);
    };

    const handleChange = (index: number, field: keyof CategoryInput, value: string) => {
        const updated = [...categories];
        if (field === 'name' || field === 'amount') {
            updated[index][field] = value;
        }
        setCategories(updated);
    };

    const handleSubmit = async () => {
        let payload: CategoryInput[] = [];

        payload = categories.filter(c =>
            c.isNew &&
            c.name.trim() &&
            c.amount.trim() &&
            !isNaN(Number(c.amount)) &&
            Number(c.amount) > 0
        );

        if (payload.length === 0 && mode !== 'update') {
            showToast('error', 'Please provide valid name and amount for at least one category.');
            return;
        }

        if (mode === 'add') {
            payload = categories.filter(c => c.isNew && c.name.trim());
        } else {
            payload = categories.filter(c => c.name.trim());
        }

        const apiMap = {
            init: endpoints.categoryIntiate,
            add: endpoints.categoryEndpoint,
            update: endpoints.categoryEndpoint,
        };

        const requestBody =
            mode === 'update'
                ? { mode: updateMode, categories: payload }
                : payload;

        try {
            setSubmitting(true);
            let response;

            if (mode === 'update') {
                response = await apiClient.put(apiMap[mode], requestBody);
            } else {
                response = await apiClient.post(apiMap[mode], requestBody);
            }

            showToast('success', response.data.message || 'Action completed successfully!');

            if (onSuccess) {
                setTimeout(() => {
                    onSuccess();
                }, 1800); 
            }

        } catch (err: any) {
            console.error(err);
            showToast('error', err?.response?.data?.message || 'Something went wrong!');
        } finally {
            setSubmitting(false);
        }
    };

    const isEditableName = (item: CategoryInput, index: number) => {
        if (mode === 'add') return !!item.isNew;
        const name = item.name.toLowerCase();
        if (['init', 'update'].includes(mode)) {
            return !(name === 'loan' || name === 'savings');
        }
        return false;
    };

    const isEditableAmount = (item: CategoryInput) => {
        if (mode === 'add') return !!item.isNew;
        const name = item.name.toLowerCase();
        if (mode === 'update') {
            if (updateMode === 'temporary') return true;
            return name !== 'loan';
        }
        return true;
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
            <TouchableOpacity onPress={() => setActiveSection(null)} style={tw`mb-3`}>
                <Text style={tw`text-blue-500 text-sm`}>← Back</Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled">
                {categories.map((item, idx) => (
                    <View key={idx} style={tw`flex-row items-center mb-4`}>
                        <View style={tw`flex-1 mr-2`}>
                            <TextInput
                                style={tw`border border-gray-300 rounded px-3 py-2 text-sm ${!isEditableName(item, idx) ? 'bg-gray-100' : ''}`}
                                placeholder="Category name"
                                value={item.name}
                                onChangeText={(text) => handleChange(idx, 'name', text)}
                                editable={isEditableName(item, idx)}
                            />
                        </View>
                        <View style={tw`w-24 mr-2`}>
                            <TextInput
                                style={tw`border border-gray-300 rounded px-3 py-2 text-sm ${!isEditableAmount(item) ? 'bg-gray-100' : ''}`}
                                placeholder="Amount"
                                keyboardType="numeric"
                                value={item.amount}
                                onChangeText={(text) => handleChange(idx, 'amount', text)}
                                editable={isEditableAmount(item)}
                            />
                        </View>

                        {(mode !== 'update' && isEditableName(item, idx)) && (
                            <TouchableOpacity onPress={() => handleRemoveRow(idx)} style={tw`p-2`}>
                                <Ionicons name="remove-circle" size={24} color="red" />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </ScrollView>

            {mode !== 'update' && (
                <TouchableOpacity
                    style={tw`flex-row items-center justify-start mb-6`}
                    onPress={handleAddRow}
                >
                    <Ionicons name="add-circle-outline" size={24} color="blue" />
                    <Text style={tw`ml-2 text-blue-600`}>Add Category</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={tw`bg-blue-600 rounded-xl py-3`}
                onPress={handleSubmit}
                disabled={submitting}
            >
                <Text style={tw`text-center text-white font-semibold`}>
                    {submitting ? <ActivityIndicator size="small" color="#2563EB" /> : 'Submit'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default CategorySetup;
