import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext.jsx';

const AccessControlContext = createContext();

export const useAccessControl = () => {
    const context = useContext(AccessControlContext);
    if (!context) {
        throw new Error('useAccessControl must be used within AccessControlProvider');
    }
    return context;
};

export const AccessControlProvider = ({ children }) => {
    const [userPermissions, setUserPermissions] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (!user) {
            setUserPermissions(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        fetchUserPermissions();
    }, [user]);

    const fetchUserPermissions = async () => {
        try {
            const response = await axios.get('/api/user/permissions');
            setUserPermissions(response.data);
        } catch (error) {
            console.error('Failed to fetch permissions:', error);
            setUserPermissions({ features: ['tasks'], max_containers: 2 });
        } finally {
            setLoading(false);
        }
    };

    const hasAccess = (feature) => {
        if (!userPermissions) return false;
        return userPermissions.features.includes('*') || userPermissions.features.includes(feature);
    };

    const canAddContainer = (currentCount) => {
        if (!userPermissions) return false;
        return userPermissions.max_containers === -1 || currentCount < userPermissions.max_containers;
    };

    return (
        <AccessControlContext.Provider value={{
            userPermissions,
            hasAccess,
            canAddContainer,
            loading,
            refreshPermissions: fetchUserPermissions
        }}>
            {children}
        </AccessControlContext.Provider>
    );
};