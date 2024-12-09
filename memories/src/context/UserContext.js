import { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from '../firebase/firebaseConfig.js';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [uid, setUid] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const userUid = user.uid;
                setUid(userUid);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ uid, setUid }}>
            {!loading && children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);