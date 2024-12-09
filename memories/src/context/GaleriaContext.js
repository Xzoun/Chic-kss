import React, { createContext, useState,useContext, useParams, useEffect } from 'react';
import { readEvent, guestExists, updateEvent } from '../firebase/firebaseDatabase';
import { useUser } from './UserContext';
import { Loading } from '../components/Loading';
import Header from '../components/Header';
import Nav from '../components/Nav';

const GaleriaContext = createContext();

export const GaleriaProvider = ({ children }) => {
    const { event } = useParams();
    const [eventData, setEventData] = useState(null);
    const [state, setState] = useState(0);
    const uid = useUser().uid;

    useEffect(() => {
        const fetchAlbum = async () => {
            try {
                const fullEventData = await readEvent(event);

                if (fullEventData) {

                    if (!(guestExists(eventData, uid))) {
                        eventData.guests.push(uid);
                        await updateEvent(eventData);
                    }
                    setEventData(fullEventData);

                } else {
                    setState(0);
                }

            } catch (error) {
                console.error('Error al obtener el álbum:', error);
            }
        };

        fetchAlbum();

    }, [event, uid, eventData]);

    if (eventData) {
        setState(1);
    }

    if (state === 0) {
        return (
            <>
                <Header />
                <Nav />
                <Loading />
            </>
        );
    }

    return (
        <GaleriaContext.Provider value={{ eventData, state }}>
            {children}
        </GaleriaContext.Provider>
    );
};

export const useGallery = () => useContext(GaleriaContext);

