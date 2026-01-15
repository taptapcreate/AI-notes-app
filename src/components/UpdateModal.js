import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';

const UpdateModal = () => {
    const { getCreditData } = useUser();
    const { appConfig } = getCreditData();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (appConfig && appConfig.updateAvailable) {
            setVisible(true);
        }
    }, [appConfig]);

    if (!visible || !appConfig) return null;

    const handleUpdate = () => {
        if (appConfig.storeUrl) {
            Linking.openURL(appConfig.storeUrl);
        }
    };

    const handleLater = () => {
        if (!appConfig.forceUpdate) {
            setVisible(false);
        }
    };

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={handleLater}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header Image/Icon */}
                    <View style={styles.iconContainer}>
                        <Image
                            source={require('../../assets/icon.png')}
                            style={styles.icon}
                        />
                        <View style={styles.badge}>
                            <Ionicons name="arrow-up" size={16} color="#fff" />
                        </View>
                    </View>

                    <Text style={styles.title}>Update Available!</Text>

                    <Text style={styles.message}>
                        A new version {appConfig.latestVersion} is available on the {appConfig.storeName || 'Store'}.
                        Update now for the latest features and fixes!
                    </Text>

                    <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                        <Text style={styles.updateButtonText}>Update Now</Text>
                    </TouchableOpacity>

                    {!appConfig.forceUpdate && (
                        <TouchableOpacity style={styles.laterButton} onPress={handleLater}>
                            <Text style={styles.laterButtonText}>Maybe Later</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        backgroundColor: '#1E293B', // Slate-800
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        marginBottom: 20,
        position: 'relative',
    },
    icon: {
        width: 80,
        height: 80,
        borderRadius: 20,
    },
    badge: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        backgroundColor: '#10B981', // Emerald-500
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#1E293B',
    },
    title: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        color: '#94A3B8', // Slate-400
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    updateButton: {
        backgroundColor: '#6366F1', // Indigo-500
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    laterButton: {
        paddingVertical: 10,
    },
    laterButtonText: {
        color: '#94A3B8',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default UpdateModal;
