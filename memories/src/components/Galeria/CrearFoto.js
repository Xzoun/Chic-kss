import { useUser } from '../../context/UserContext.js';
import { useParams } from 'react-router-dom';

import { getAllDesignPhotos, savePhoto } from '../../firebase/firebaseStorage.js';
import { createPhoto, listenToEvent, readEvent } from '../../firebase/firebaseDatabase.js';

import { Toaster, toast } from "react-hot-toast";
import { toastOptions } from '../specialFunctions.js';
import { useEffect, useState } from 'react';

export function CrearFoto() {

    const userUid = useUser().uid;
    const { event } = useParams();
    const [design, setDesign] = useState(null);
    const [reLoad, setReLoad] = useState(0);
    const [photosTaken, setPhotosTaken] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const fotos = await getAllDesignPhotos();
                setDesign(fotos);
            } catch (error) {
                console.log(error);
            }
        }

        fetchUserData();
    }, []);

    useEffect(() => {
        listenToEvent((hasChanges) => {
            if (hasChanges) {
                let timer;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    setReLoad(prevCount => prevCount + 1);
                }, 5000);
            }
        }, event);

    }, [event]);

    useEffect(() => {
        const fetchPhotosTaken = async () => {
            try {
                const eventInfo = await readEvent(event);
                if (eventInfo && eventInfo.fotos) {
                    const guestsPhotos = await Promise.all(eventInfo.fotos.map(async (foto) => {

                        if (foto.codigoUsuario === userUid) {

                            return foto;
                        }

                        return null;
                    }));

                    const photosTaken = guestsPhotos.filter(photo => photo !== null);

                    if (photosTaken.length > 0) {
                        setPhotosTaken(photosTaken);
                    }
                }
            } catch (error) {
                console.log(error);
            }


        }

        if (event) {
            fetchPhotosTaken();
        }

    }, [reLoad, event, userUid]);

    const handlePhotoCapture = async (e) => {
        const file = e.target.files[0];

        try {
            if (file) {
                await toast.promise(
                    (async () => {
                        const fotoUID = await createPhoto(event, userUid);
                        await savePhoto(`events/${event}/${fotoUID}`, file);
                    })(),
                    {
                        loading: 'Subiendo la foto...',
                        success: 'Foto creada con éxito!',
                        error: 'Ocurrió un error al subir la foto.',
                    }
                );

                let timer;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    setReLoad(prevCount => prevCount + 1);
                }, 5000);

            } else {
                console.log('No se ha seleccionado ninguna foto');
            }

        } catch (error) {
            console.error('Error al subir la foto:', error);
        }
    };

    if (design && photosTaken.length < 10) {
        return (
            <>
                <Toaster containerStyle={{ position: 'fixed', top: '11vh', right: '2vw', zIndex: '9999' }}  {...toastOptions()} reverseOrder={true} />
                <div className='borderRound fixedRightBot'>
                    <label htmlFor="cameraInput">
                        <img alt="camera icon" className="icon camera" src={design["camera"].url} />
                    </label>
                    <input id="cameraInput" type="file" accept="image/*" capture="environment" onChange={(e) => { handlePhotoCapture(e) }} style={{ display: 'none' }} />
                </div>
            </>
        )
    }
}