import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../context/UserContext.js';
import { readEvent, guestExists, updateEvent, eventExists } from '../firebase/firebaseDatabase';

import { Loading } from '../components/Loading.js';

import { Guests } from '../components/Galeria/Guests.js';
import { Galeria } from '../components/Galeria/Galeria.js';
import { CrearFoto } from '../components/Galeria/CrearFoto.js';
import { Portada } from '../components/Galeria/Portada.js';

const AlbumView = () => {
    const { event } = useParams();
    const uid = useUser().uid;
    const [eventData, setEventData] = useState("");
    const [state, setState] = useState(0);

    useEffect(() => {
        const fetchAlbum = async () => {
            try {
                const eventData = await readEvent(event);
                const exists = await eventExists(event);

                if (eventData) {
                    setState(1);
                    const userExistsInEvent = await guestExists(eventData, uid)
                    if (!userExistsInEvent) {
                        eventData.guests.push(uid);
                        await updateEvent(eventData);
                    }
                    setEventData(eventData);
                }

                if (!exists) {
                    setState(2);
                }
            } catch (error) {
                console.error('Error al obtener el álbum:', error);
            }
        };

        fetchAlbum();
    }, [event, uid]);

    if (state === 0) {
        return (
            <>
                <Loading />
            </>
        )
    }

    if (state === 1) {
        return (
            <div className='back'>
                <div className='layout'>
                    <Portada />
                    <h1>{eventData.name}</h1>
                    <Guests />
                    <CrearFoto />
                    <Galeria />
                </div>
            </div>
        );
    }

    if (state === 2) {
        return (
            <div className='back' >
                <div className='layout'>
                    <h2 className="empty headerBloque">El evento no existe.</h2>
                </div>
            </div>
        )
    }
};

export default AlbumView;