import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';

import { readURLImg, getAllPhotos, getAllDesignPhotos, deletePhoto } from '../../firebase/firebaseStorage.js';
import { getPhotoLikes, listenToEvent, readPhotographer, readUser, updatePhoto, getPhotoReports, deletePhoto as deletePhotoDB } from '../../firebase/firebaseDatabase.js';

import Select from 'react-select';
import { Encrypt, selectCustomStyles, selectOptions, toastOptions } from '../specialFunctions.js';

import '../../css/galeria.css';
import { useUser } from '../../context/UserContext.js';
import toast, { Toaster } from 'react-hot-toast';

export function Galeria() {
    const [imgsData, setImgsData] = useState(null);
    const { event } = useParams();
    const currentUser = useUser().uid;
    const [state, setState] = useState(0);
    const [selectedPhoto, setSelectedPhoto] = useState(0);
    const [sortedData, setSortedData] = useState(null);
    const [filtro, setFiltro] = useState(0);
    const [reLoad, setReLoad] = useState(0);
    const Navigate = useNavigate();
    const [design, setDesign] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const fotos = await getAllDesignPhotos();
            setDesign(fotos);
        }

        fetchUserData();
    }, []);

    useEffect(() => {
        let timer;
        listenToEvent((hasChanges) => {
            if (hasChanges) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    setReLoad(prevCount => prevCount + 1);
                }, 2000);
            }
        }, event);

    }, [event]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fetchedFotos = await getAllPhotos(event);

                const imgsData = await Promise.all(fetchedFotos.map(async (uid, index) => {
                    try {
                        if (uid) {
                            const route = `events/${event}/${uid}`;
                            const imgUrl = await readURLImg(route);
                            const pov = await readPhotographer(event, index);
                            const userData = await readUser(pov);
                            const likes = await getPhotoLikes(event, uid);
                            const reports = await getPhotoReports(event, uid);

                            return {
                                uid: uid,
                                url: imgUrl,
                                likes: likes,
                                reports: reports,
                                user: userData
                            };
                        }
                    } catch (error) {
                        return null;
                    }

                }));

                setImgsData(imgsData.filter(img => img !== null));
            } catch (error) {
                console.log('Error al obtener los datos:', error);
            }
        };

        fetchData();

    }, [reLoad, event]);

    const handlers = useSwipeable({
        onSwipedLeft: () => handleBefore(selectedPhoto),
        onSwipedRight: () => handleNext(selectedPhoto),
    });

    const handlersView = useSwipeable({
        onSwipedRight: () => Navigate("/home"),
        onSwipedLeft: () => Navigate("/inbox")
    });

    const handleChange = (selectedOption) => {
        let temporaryData = [...imgsData];
        setSelectedPhoto(0);
        setState(2);
        switch (selectedOption.value) {
            case 'cronologico':
                temporaryData.sort((a, b) => a.uid - b.uid);
                setSortedData(temporaryData);
                setFiltro(0);
                break;
            case 'ultima':
                temporaryData.sort((b, a) => a.uid - b.uid);
                setSortedData(temporaryData);
                setFiltro(1);
                break;
            case 'pov':
                temporaryData.sort((a, b) => b.user.displayName.localeCompare(a.user.displayName));
                setSortedData(temporaryData);
                setFiltro(2);
                break;
            case 'likes':
                temporaryData.sort((a, b) => b.likes.length - a.likes.length);
                setSortedData(temporaryData);
                setFiltro(3);
                break;
            default:

        }
    };

    const handleOpenPhoto = (index) => {
        if (state < 1) {
            setState(1);
        }
        setSelectedPhoto(index);
    };

    const handleLike = async (sender) => {
        try {
            let interrupt = false;
            let temporaryData = [...imgsData];

            temporaryData.sort((a, b) => a.uid - b.uid);

            let index = null;

            switch (sender) {
                case 0:
                    if ((currentUser === imgsData[selectedPhoto].user.uid)) { interrupt = true; break; }
                    index = temporaryData.findIndex(img => img.uid === imgsData[selectedPhoto].uid);
                    break;
                case 1:
                    if ((currentUser === sortedData[selectedPhoto].user.uid)) { interrupt = true; break; }
                    index = temporaryData.findIndex(img => img.uid === sortedData[selectedPhoto].uid);
                    break;
                default:
                    break;
            }

            if (!interrupt) {
                if (index !== -1) {
                    const alreadyLiked = temporaryData[index].likes.includes(currentUser);

                    if (alreadyLiked) {
                        temporaryData[index].likes = temporaryData[index].likes.filter(uid => uid !== currentUser);
                    } else {
                        temporaryData[index].likes.push(currentUser);
                    }

                    setImgsData(prevImgsData => {
                        const updatedImgsData = [...prevImgsData];
                        updatedImgsData[index] = {
                            ...updatedImgsData[index],
                            likes: temporaryData[index].likes
                        };
                        return updatedImgsData;
                    });
                    try {
                        const imgData = {
                            codigoUsuario: temporaryData[index].user.uid,
                            uid: temporaryData[index].uid,
                            likes: temporaryData[index].likes,
                            eventUid: event
                        };

                        await updatePhoto(event, imgData, index);
                    } catch (error) {
                        console.log("No se pudo likear la foto.")
                    }
                }
            }
        } catch (error) {
            console.error("Error en handleLike:", error);
        }
    }

    const handleDeletePhoto = async (sender) => {
        try {
            let temporaryData = [...imgsData];
            temporaryData.sort((a, b) => a.uid - b.uid);

            let index = null;

            switch (sender) {
                case 0:
                    index = temporaryData.findIndex(img => img.uid === imgsData[selectedPhoto].uid);
                    break;
                case 1:
                    index = temporaryData.findIndex(img => img.uid === sortedData[selectedPhoto].uid);
                    break;
                default:
                    break;
            }

            if (index !== -1) {
                const confirmDelete = window.confirm("\n     ¿Eliminamos la foto?\n\n ⛔ Esta acción no se puede deshacer. ⛔");

                if (confirmDelete) {
                    try {
                        await deletePhotoDB(event, temporaryData[index].uid);
                        await deletePhoto(`events/${event}/${temporaryData[index].uid}`);
                        temporaryData.splice(index, 1);

                        let timer;
                        clearTimeout(timer);
                        timer = setTimeout(() => {
                            setReLoad(prevCount => prevCount + 1);
                            toast.success("Foto eliminada correctamente", { duration: 2000 });
                        }, 5000);

                        setImgsData(temporaryData);
                        setState(0);
                    } catch (error) {
                        toast.error("Error al eliminar la foto", { duration: 2000 });
                        console.error("Error en handleDeletePhoto:", error);
                    }
                }
            }

        } catch (error) {
            console.error("Error en handleDeletePhoto:", error);
        }
    }

    const handleReport = async (sender) => {
        try {
            let interrupt = false;
            let temporaryData = [...imgsData];

            temporaryData.sort((a, b) => a.uid - b.uid);

            let index = null;

            switch (sender) {
                case 0:
                    if ((currentUser === imgsData[selectedPhoto].user.uid)) { interrupt = true; break; }
                    index = temporaryData.findIndex(img => img.uid === imgsData[selectedPhoto].uid);
                    break;
                case 1:
                    if ((currentUser === sortedData[selectedPhoto].user.uid)) { interrupt = true; break; }
                    index = temporaryData.findIndex(img => img.uid === sortedData[selectedPhoto].uid);
                    break;
                default:
                    break;
            }

            if (!interrupt) {
                if (index !== -1) {
                    console.log(index);
                    const confirmReport = window.confirm("\n     ¿Reportar foto?\n\n ⛔ Se notificará a un administrador. ⛔");

                    if (confirmReport) {
                        let reports = [];

                        if (Array.isArray(temporaryData[index].reports)) {
                            reports = temporaryData[index].reports;
                        }

                        const alreadyReported = reports.includes(currentUser);

                        if (alreadyReported) {
                            reports = temporaryData[index].reports.filter(uid => uid !== currentUser);
                        } else {
                            reports.push(currentUser);
                        }

                        try {
                            const imgData = {
                                codigoUsuario: temporaryData[index].user.uid,
                                uid: temporaryData[index].uid,
                                likes: temporaryData[index].likes,
                                eventUid: event,
                                reports: reports
                            };

                            await updatePhoto(event, imgData, index);
                            toast.success("Foto reportada exitosamente!", { duration: 2000 });
                        } catch (error) {
                            toast.error("Error al reportar la foto", { duration: 2000 });
                        }
                    }

                }
            }
        } catch (error) {
            console.error("Error en handleLike:", error);
        }
    }

    const handleNext = (index) => {
        if (index >= (imgsData.length - 1)) {
            setSelectedPhoto(0);
        } else {
            setSelectedPhoto(index + 1);
        }
    }

    const handleBefore = (index) => {
        if (index <= 0) {
            setSelectedPhoto(imgsData.length - 1);
        } else {
            setSelectedPhoto(index - 1);
        }
    }

    const handleGoToProfile = (uid) => {
        const enctryptedUid = Encrypt(uid);
        Navigate(`/profile/${enctryptedUid}`)
    }

    if (state === 1) {
        return (
            <div className='backGallery'>
                {imgsData && imgsData.length > 0 && (

                    <div className='photoLayout'>
                        <Toaster containerStyle={{ position: 'fixed', top: '11vh', right: '2vw', zIndex: '9999' }}  {...toastOptions()} reverseOrder={true} />
                        <div className='photoViewCont' {...handlers}>
                            <button className='closePhotoBtn' onClick={() => { setState(0) }}><img src={design["close"].url} alt='Salir' className='cerrarPhotoImg' /></button>
                            <button className='likePhotoBtn' onClick={() => { handleLike(0) }}><img src={`${imgsData[selectedPhoto].likes.includes(currentUser) ? design["liked"].url :  design["like"].url}`} alt='Like' className={`${imgsData[selectedPhoto].likes.includes(currentUser) ? 'likedPhotoImg' : 'likePhotoImg'}`} /></button>
                            <button className={`${imgsData[selectedPhoto].user.uid === currentUser ? 'hiddenDeletePhotoBtn' : 'reportPhotoBtn'}`} onClick={() => { handleReport(0) }}><img src={design["report"].url} alt='Report' className='reportPhotoImg' /></button>
                            <button className={`${imgsData[selectedPhoto].user.uid === currentUser ? 'deletePhotoBtn' : 'hiddenDeletePhotoBtn'}`} onClick={() => { handleDeletePhoto(0) }}><img src={design["delete"].url} alt='Eliminar' className="deletePhotoImg" /></button>
                            <div className='controls'>
                                <button className='controlBtn' onClick={() => { handleBefore(selectedPhoto) }}></button>
                                <button className='controlBtn' onClick={() => { handleNext(selectedPhoto) }}></button>
                            </div>
                            <img className='photoView borderRad' src={imgsData[selectedPhoto].url} alt={`Foto ${selectedPhoto}`} />

                            <div onClick={() => { handleGoToProfile(imgsData[selectedPhoto].user.uid) }}>
                                <div className='userInfo'>
                                    <img className='userPhoto' src={imgsData[selectedPhoto].user.photoURL} alt={`Foto ${imgsData[selectedPhoto].user.displayName}`} />
                                    <h2>{imgsData[selectedPhoto].user.displayName}</h2>
                                </div>
                            </div>

                        </div>

                        <div className='gallery' {...handlersView}>
                            <Select styles={selectCustomStyles} options={selectOptions} onChange={handleChange} autoFocus={false} isSearchable={false} defaultValue={selectOptions[0]} />

                            <div className='photoContainer'>
                                {imgsData.map((img, index) => (
                                    <div key={index} onClick={() => { handleOpenPhoto(index) }}>
                                        <img className='photo' src={img.url} alt={`Foto ${index}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (state === 2) {
        return (
            <div className='backGallery'>
                <div className='photoLayout'>
                    <Toaster containerStyle={{ position: 'fixed', top: '11vh', right: '2vw', zIndex: '9999' }}  {...toastOptions()} reverseOrder={true} />
                    <div className='photoViewCont' {...handlers}>
                        <button className='closePhotoBtn' onClick={() => { setState(0) }}><img src={design["close"].url} alt='Close' className='cerrarPhotoImg' /></button>
                        <button className='likePhotoBtn' onClick={() => { handleLike(1) }}><img src={`${imgsData[selectedPhoto].likes.includes(currentUser) ? design["liked"].url :  design["like"].url}`} alt='Like' className={`${sortedData[selectedPhoto].likes.includes(currentUser) ? 'likedPhotoImg' : 'likePhotoImg'}`} /></button>
                        <button className={`${sortedData[selectedPhoto].user.uid === currentUser ? 'reportPhotoBtn' : 'hiddenDeletePhotoBtn'}`} onClick={() => { handleReport(1) }}><img src={design["report"].url} alt='Report' className='reportPhotoImg' /></button>
                        <button className={`${sortedData[selectedPhoto].user.uid === currentUser ? 'deletePhotoBtn' : 'hiddenDeletePhotoBtn'}`} onClick={() => { handleDeletePhoto(1) }}><img src={design["delete"].url} alt='Eliminar' className="deletePhotoImg" /></button>
                        <div className='controls'>
                            <button className='controlBtn' onClick={() => { handleBefore(selectedPhoto) }}></button>
                            <button className='controlBtn' onClick={() => { handleNext(selectedPhoto) }}></button>
                        </div>
                        <img className='photoView borderRad' src={sortedData[selectedPhoto].url} alt={`Foto ${selectedPhoto}`} />

                        <div onClick={() => { handleGoToProfile(sortedData[selectedPhoto].user.uid) }}>
                            <div className='userInfo'>
                                <img className='userPhoto' src={sortedData[selectedPhoto].user.photoURL} alt={`Foto ${sortedData[selectedPhoto].user.displayName}`} />
                                <h2>{sortedData[selectedPhoto].user.displayName}</h2>
                            </div>
                        </div>
                    </div>

                    <div className='gallery' {...handlersView}>
                        <Select styles={selectCustomStyles} options={selectOptions} onChange={handleChange} autoFocus={false} isSearchable={false} defaultValue={selectOptions[filtro]} tabIndex={-1} />

                        <div className='photoContainer'>
                            {sortedData.map((img, index) => (
                                <div className='focusOut' key={index} onClick={() => { handleOpenPhoto(index) }}>
                                    <img className='photo' src={img.url} alt={`Foto ${index}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (

        <>
            {imgsData && imgsData.length > 0 && (

                <div className='gallery' {...handlersView}>
                    <Select styles={selectCustomStyles} options={selectOptions} onChange={handleChange} placeholder="Select an option..." autoFocus={false} isSearchable={false} defaultValue={selectOptions[0]} />

                    <div className='photoContainer'>
                        {imgsData.map((img, index) => (
                            <div key={index} onClick={() => { handleOpenPhoto(index) }}>
                                <img className='photo' src={img.url} alt={`Foto ${index}`} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(!imgsData || imgsData.length === 0) && (
                <div className='padding'>
                    <h2 className="empty">No se registran fotos!</h2>
                </div>
            )}
        </>
    );
}