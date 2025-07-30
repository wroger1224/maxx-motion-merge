import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useUser } from '../../contexts/UserContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { updateUserAdminStatus } from '@/lib/services/auth';
import { showAlert } from '../utils/showAlert';

type User = {
    id: string;
    full_name: string;
    email: string;
    is_admin: boolean;
};

export default function UserManagementScreen() {
    const { userProfile, loading } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showConfirmPopup, setShowConfirmPopup] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'make' | 'remove' | 'delete' | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    // Redirect non-admin users
    React.useEffect(() => {
        if (!loading && userProfile && !userProfile.is_admin) {
            router.replace('/(tabs)');
        }
    }, [userProfile, loading]);

    // Search users by name
    const searchUsers = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, is_admin')
                .ilike('full_name', `%${query}%`)
                .limit(5);

            if (error) {
                console.error('Error searching users:', error);
                showAlert('Error', 'Failed to search users');
                return;
            }

            setSearchResults(data || []);
        } catch (error) {
            console.error('Unexpected error:', error);
            showAlert('Error', 'An unexpected error occurred');
        }
    };

    // Send invitation email
    const sendInvitation = async () => {
        if (!inviteEmail.trim()) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }

        try {
            setIsInviting(true);

            // Check if user already exists
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', inviteEmail)
                .single();

            if (existingUser) {
                Alert.alert('Error', 'A user with this email already exists');
                return;
            }

            // Determine the redirect URL based on environment
            const redirectUrl = __DEV__ 
                ? 'http://localhost:8081/login'
                : `${window.location.origin}/login`;

            // Send magic link to login page
            const { error } = await supabase.auth.signInWithOtp({
                email: inviteEmail,
                options: {
                    emailRedirectTo: redirectUrl
                }
            });

            if (error) {
                console.error('Error sending invitation:', error);
                Alert.alert('Error', 'Failed to send invitation');
                return;
            }

            setSuccessMessage(`Login link sent to ${inviteEmail}`);
            setShowSuccessPopup(true);
            setInviteEmail('');
        } catch (error) {
            console.error('Unexpected error:', error);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setIsInviting(false);
        }
    };

    // Update user admin status
    const handleUpdateAdminStatus = async (newAdminStatus: boolean) => {
        if (!selectedUser) {
            showAlert('Error', 'Please select a user');
            return;
        }

        try {
            setIsLoading(true);
            console.log('Starting admin status update for user:', {
                userId: selectedUser.id,
                currentStatus: selectedUser.is_admin,
                newStatus: newAdminStatus,
                fullName: selectedUser.full_name
            });

            const success = await updateUserAdminStatus(selectedUser.id, newAdminStatus);
            console.log('Update result:', success);

            if (success) {
                // Add a small delay to make the loading state visible
                await new Promise(resolve => setTimeout(resolve, 500));

                // Verify the change in the database
                const { data: updatedUser, error: verifyError } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', selectedUser.id)
                    .single();

                console.log('Verification result:', { updatedUser, verifyError });

                if (verifyError) {
                    console.error('Error verifying update:', verifyError);
                    showAlert('Error', 'Failed to verify the update');
                    return;
                }

                if (updatedUser.is_admin === newAdminStatus) {
                    setSuccessMessage(`Successfully ${newAdminStatus ? 'granted' : 'removed'} admin privileges for ${selectedUser.full_name}`);
                    setShowSuccessPopup(true);

                    // Add a small delay before resetting the form
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Reset form after successful update
                    setSelectedUser(null);
                    setSearchQuery('');
                    setIsAdmin(newAdminStatus);
                } else {
                    console.error('Verification failed: admin status mismatch', {
                        expected: newAdminStatus,
                        actual: updatedUser.is_admin
                    });
                    showAlert('Error', 'Failed to verify the admin status update. Please try again.');
                }
            } else {
                console.error('Update failed: updateUserAdminStatus returned false');
                showAlert('Error', 'Failed to update admin status. Please try again.');
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            showAlert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle user selection
    const handleUserSelect = (user: User) => {
        console.log('Selected user:', user);
        setSelectedUser(user);
        setIsAdmin(user.is_admin);
        setSearchQuery(user.full_name);
        setSearchResults([]);
    };

    // Handle closing the success popup
    const handleCloseSuccessPopup = () => {
        setShowSuccessPopup(false);
        setSuccessMessage('');
    };

    // Handle user deletion
    const handleDeleteUser = async () => {
        if (!selectedUser) {
            Alert.alert('Error', 'Please select a user');
            return;
        }

        try {
            setIsLoading(true);

            const { data, error } = await supabase.functions.invoke('delete-user', {
                body: {userId: selectedUser.id },
            });

            if (error) {
                console.error('Error deleting user from auth:', error);
                setSuccessMessage(`Failed to delete user ${selectedUser.full_name}`);
                setShowSuccessPopup(true);
                return;
            }

            setSuccessMessage(`Successfully removed user ${selectedUser.full_name}`);
            setShowSuccessPopup(true);

            // Reset form after successful deletion
            setSelectedUser(null);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Unexpected error:', error);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Update handleConfirmAction to include delete action
    const handleConfirmAction = () => {
        if (confirmAction === 'make') {
            handleUpdateAdminStatus(true);
        } else if (confirmAction === 'remove') {
            handleUpdateAdminStatus(false);
        } else if (confirmAction === 'delete') {
            handleDeleteUser();
        }
        setShowConfirmPopup(false);
        setConfirmAction(null);
    };

    // Handle cancel action
    const handleCancelAction = () => {
        setShowConfirmPopup(false);
        setConfirmAction(null);
    };

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText>Loading...</ThemedText>
            </ThemedView>
        );
    }

    // Only render the content if the user is an admin
    if (!userProfile?.is_admin) {
        return null;
    }

    return (
        <ScrollView style={styles.scrollView}>
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.title}>User Management</ThemedText>

                {/* Invite User Section */}
                <ThemedView style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Invite New User</ThemedText>
                    <View style={styles.inviteContainer}>
                        <TextInput
                            style={[styles.input, isInviting && styles.disabledInput]}
                            placeholder="Enter email address"
                            value={inviteEmail}
                            onChangeText={setInviteEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isInviting}
                        />
                        <TouchableOpacity
                            style={[styles.inviteButton, isInviting && styles.disabledButton]}
                            onPress={sendInvitation}
                            disabled={isInviting}
                        >
                            <ThemedText style={styles.inviteButtonText}>
                                {isInviting ? 'Sending...' : 'Send Invitation'}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </ThemedView>

                {/* Existing User Management Section */}
                <ThemedView style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Manage Existing Users</ThemedText>
                    <TextInput
                        style={[styles.input, isLoading && styles.disabledInput]}
                        placeholder="Search user by name"
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            searchUsers(text);
                        }}
                        editable={!isLoading}
                    />
                    {searchResults.length > 0 && (
                        <View style={[styles.searchResults, isLoading && styles.disabledInput]}>
                            {searchResults.map((user) => (
                                <TouchableOpacity
                                    key={user.id}
                                    style={[styles.searchResultItem, isLoading && styles.disabledInput]}
                                    onPress={() => handleUserSelect(user)}
                                    disabled={isLoading}
                                >
                                    <ThemedText>{user.full_name}</ThemedText>
                                    <ThemedText style={styles.emailText}>{user.email}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    {selectedUser && (
                        <View style={[styles.selectedUser, isLoading && styles.disabledInput]}>
                            <ThemedText style={styles.selectedUserName}>{selectedUser.full_name}</ThemedText>
                            <ThemedText style={styles.selectedUserEmail}>{selectedUser.email}</ThemedText>
                            <ThemedText style={styles.currentStatus}>
                                Current Status: {selectedUser.is_admin ? 'Admin' : 'User'}
                            </ThemedText>
                        </View>
                    )}
                    <View style={styles.adminToggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.adminToggleButton,
                                isAdmin && styles.adminToggleButtonActive,
                                isLoading && styles.disabledButton
                            ]}
                            onPress={() => {
                                setConfirmAction('make');
                                setShowConfirmPopup(true);
                            }}
                            disabled={!selectedUser || isLoading}
                        >
                            <ThemedText style={[
                                styles.adminToggleButtonText,
                                isLoading && styles.disabledButtonText
                            ]}>
                                {isLoading ? 'Updating...' : 'Make Admin'}
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.adminToggleButton,
                                !isAdmin && styles.adminToggleButtonActive,
                                isLoading && styles.disabledButton
                            ]}
                            onPress={() => {
                                setConfirmAction('remove');
                                setShowConfirmPopup(true);
                            }}
                            disabled={!selectedUser || isLoading}
                        >
                            <ThemedText style={[
                                styles.adminToggleButtonText,
                                isLoading && styles.disabledButtonText
                            ]}>
                                {isLoading ? 'Updating...' : 'Remove Admin'}
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.deleteButton,
                                isLoading && styles.disabledButton
                            ]}
                            onPress={() => {
                                setConfirmAction('delete');
                                setShowConfirmPopup(true);
                            }}
                            disabled={!selectedUser || isLoading}
                        >
                            <ThemedText style={[
                                styles.deleteButtonText,
                                isLoading && styles.disabledButtonText
                            ]}>
                                {isLoading ? 'Removing...' : 'Remove User'}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </ThemedView>

                {/* Success Popup */}
                {showSuccessPopup && (
                    <View style={styles.popupOverlay}>
                        <View style={styles.popupContent}>
                            <ThemedText style={styles.popupTitle}>Success!</ThemedText>
                            <ThemedText style={styles.popupMessage}>{successMessage}</ThemedText>
                            <TouchableOpacity
                                style={styles.popupButton}
                                onPress={handleCloseSuccessPopup}
                            >
                                <ThemedText style={styles.popupButtonText}>OK</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Confirmation Popup */}
                {showConfirmPopup && (
                    <View style={styles.popupOverlay}>
                        <View style={styles.popupContent}>
                            <ThemedText style={styles.popupTitle}>
                                {confirmAction === 'make' ? 'Make Admin?' : 
                                 confirmAction === 'remove' ? 'Remove Admin?' :
                                 'Remove User?'}
                            </ThemedText>
                            <ThemedText style={styles.popupMessage}>
                                {confirmAction === 'make'
                                    ? `Are you sure you want to make ${selectedUser?.full_name} an admin?`
                                    : confirmAction === 'remove'
                                    ? `Are you sure you want to remove admin privileges from ${selectedUser?.full_name}?`
                                    : `Are you sure you want to remove ${selectedUser?.full_name} from the system? This action cannot be undone.`
                                }
                            </ThemedText>
                            <View style={styles.confirmButtons}>
                                <TouchableOpacity
                                    style={[styles.popupButton, styles.cancelButton]}
                                    onPress={handleCancelAction}
                                >
                                    <ThemedText style={styles.popupButtonText}>Cancel</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.popupButton,
                                        confirmAction === 'delete' ? styles.deleteButton : styles.confirmButton
                                    ]}
                                    onPress={handleConfirmAction}
                                >
                                    <ThemedText style={styles.popupButtonText}>
                                        {confirmAction === 'make' ? 'Make Admin' :
                                         confirmAction === 'remove' ? 'Remove Admin' :
                                         'Remove User'}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
        padding: 16,
        borderRadius: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginVertical: 5,
    },
    adminToggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    adminToggleButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    adminToggleButtonActive: {
        backgroundColor: '#0a7ea4',
    },
    adminToggleButtonText: {
        color: '#333',
        fontSize: 16,
    },
    searchResults: {
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        maxHeight: 200,
    },
    searchResultItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    emailText: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    selectedUser: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f8f8f8',
        borderRadius: 5,
    },
    selectedUserName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    selectedUserEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    currentStatus: {
        marginTop: 5,
        fontStyle: 'italic',
    },
    disabledButton: {
        opacity: 0.5,
    },
    disabledButtonText: {
        color: '#999',
    },
    disabledInput: {
        opacity: 0.7,
    },
    popupOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    popupContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        maxWidth: 400,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    popupTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#0a7ea4',
    },
    popupMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    popupButton: {
        backgroundColor: '#0a7ea4',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        minWidth: 100,
        alignItems: 'center',
    },
    popupButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    confirmButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    cancelButton: {
        backgroundColor: '#666',
        marginRight: 10,
    },
    confirmButton: {
        backgroundColor: '#0a7ea4',
        marginLeft: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    inviteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    inviteButton: {
        backgroundColor: '#0a7ea4',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 5,
        minWidth: 120,
        alignItems: 'center',
    },
    inviteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
}); 