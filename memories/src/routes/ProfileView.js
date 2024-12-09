import { getPhotoLikes, guestExists, listenToUser, readEvent, readUser, updateUser } from '../firebase/firebaseDatabase.js';
import { useUser } from '../context/UserContext.js';
import { useEffect, useState } from 'react';

import { Loading } from '../components/Loading.js';

import '../css/profile.css';
import '../css/galeria.css';
import { getAllDesignPhotos, getAllEvents, readURLImg, savePhoto } from '../firebase/firebaseStorage.js';
import { useSwipeable } from 'react-swipeable';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { toastOptions } from '../components/specialFunctions.js';

export function ProfileView() {
    const userUid = useUser().uid;
    const [userData, setUserData] = useState(null);
    const [fotosLiked, setFotosLiked] = useState(null);
    const [newName, setNewName] = useState("");
    const [newProfesion, setNewProfesion] = useState("");
    const [state, setState] = useState(0);
    const [reLoad, setReLoad] = useState(0);
    const [newRed, setNewRed] = useState({ whatsapp: "", facebook: "", instagram: "", x: "", tiktok: "", linkedin: "" });
    const [selectedPhoto, setSelectedPhoto] = useState(0);
    const [design, setDesign] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        listenToUser((hasChanges) => {
            if (hasChanges) {
                let timer;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    setReLoad(prevCount => prevCount + 1);
                }, 5000);
            }
        }, userUid);

    }, [userUid]);

    useEffect(() => {
        const fetchDesgign = async () => {
            const fotos = await getAllDesignPhotos();
            setDesign(fotos);
        }

        fetchDesgign();
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const fetchedEvents = await getAllEvents();
                const userInfo = await readUser(userUid);

                let eventsVisitedCount = 0,
                    photosTakenCount = 0;
                const photosLiked = [];

                await Promise.all(fetchedEvents.map(async uid => {
                    const eventData = await readEvent(uid);

                    if (eventData && eventData.fotos) {
                        const guest = await guestExists(eventData, userUid);

                        if (userInfo && guest) {
                            eventsVisitedCount++;

                            await Promise.all(eventData.fotos.map(async foto => {
                                try {
                                    const likes = await getPhotoLikes(eventData.uid, foto.uid);

                                    if (Array.isArray(likes)) {
                                        await Promise.all(likes.map(async uid => {
                                            if (uid === userUid) {
                                                const route = `events/${eventData.uid}/${foto.uid}`;
                                                const photoLiked = await readURLImg(route);
                                                photosLiked.push(photoLiked);
                                            }
                                        }));
                                    }
                                } catch (error) {
                                    console.log("error al obtener los likes")
                                }
                                if (foto.codigoUsuario === userInfo.uid) {
                                    photosTakenCount++;
                                }
                            }));
                        }
                    }
                }));


                userInfo.photosTaken = photosTakenCount;
                userInfo.photosliked = photosLiked.length - photosTakenCount;
                userInfo.eventsVisited = eventsVisitedCount;
                setUserData(userInfo);
                setFotosLiked(photosLiked);
            } catch (error) {
                console.error('Error al obtener los datos de eventos:', error);
            }
        };

        if (userUid) {
            fetchUserData();
        }
    }, [reLoad, userUid]);

    const handleSwipe = useSwipeable({
        onSwipedLeft: () => {
            if (state === 2) {
                handleBefore(selectedPhoto)

                return;
            }
            navigate("/home");
        },
        onSwipedRight: () => {
            if (state === 1) {
                setState(0);
                return;
            }

            if (state === 2) {
                handleNext(selectedPhoto);
                return;
            }
        },
    });

    const openAppOrBrowser = (red, perfil) => {
        const win = window.open(`https://www.${red}.com/${perfil}`, '_blank');
        win.focus();
    };

    const handleWhatsAppClick = () => {
        const win = window.open(`https://wa.me/${userData.redes.whatsapp}`, '_blank');
        win.focus();
    };

    const handleSaveTikTok = async (e) => {
        e.preventDefault();
        try {
            await updateRed("tiktok");
        } catch {

        }
    }

    const handleSaveProfesion = async (e) => {
        e.preventDefault();

        try {
            const userChanged = await readUser(userUid);

            userChanged.profesion = newProfesion;
            try {
                await updateUser(userChanged);
                toast.success("Perfil actualizado.", { duration: 2000, });
                setNewProfesion('');
            } catch (error) {
                toast.error("No se pudo actualizar el perfil.", { duration: 2000, })
            }

        } catch (error) {
            toast.error("No se pudo actualizar el perfil.", { duration: 2000, })
        }
    }

    const handleSaveNewName = async (e) => {
        e.preventDefault();
        try {
            const userChanged = await readUser(userUid);

            if (newName) {
                userChanged.displayName = newName;

                try {
                    await updateUser(userChanged);
                    toast.success("Perfil actualizado.", { duration: 2000, });

                    setNewName('');
                } catch (error) {
                    toast.error("No se pudo actualizar el perfil.", { duration: 2000, });
                }
            } else {
                toast.error("El nombre no puede quedar vacío.", { duration: 2000, });
            }

        } catch (error) {
            toast.error("No se pudo actualizar el perfil.", { duration: 2000, });
        }
    }

    const handleSaveInstagram = async (e) => {
        e.preventDefault();
        try {
            await updateRed("instagram");
        } catch {

        }
    }

    const handleSaveX = async (e) => {
        e.preventDefault();
        try {
            await updateRed("x");
        } catch {

        }
    }

    const handleSaveWhatsApp = async (e) => {
        e.preventDefault();
        try {
            await updateRed("whatsapp");
        } catch {

        }
    }

    const handleSaveLinkedin = async (e) => {
        e.preventDefault();
        try {
            await updateRed("linkedin");
        } catch {

        }
    }

    const handleSaveFacebook = async (e) => {
        e.preventDefault();
        try {
            await updateRed("facebook");
        } catch {

        }
    }

    async function updateRed(red) {
        try {
            const userChanged = await readUser(userUid);
            let skip = false;
            switch (red) {
                case "tiktok":
                    userChanged.redes.tiktok = encodeURIComponent(newRed.tiktok);
                    break;
                case "instagram":
                    userChanged.redes.instagram = encodeURIComponent(newRed.instagram);
                    break;
                case "x":
                    userChanged.redes.x = encodeURIComponent(newRed.x);
                    break;
                case "whatsapp":
                    userChanged.redes.whatsapp = encodeURIComponent(newRed.whatsapp);
                    break;
                case "linkedin":
                    userChanged.redes.linkedin = encodeURIComponent(newRed.linkedin);
                    break;
                case "facebook":
                    userChanged.redes.facebook = encodeURIComponent(newRed.facebook);
                    break;
                default:
                    skip = true;

            }

            if (!skip) {
                try {
                    await updateUser(userChanged);
                    toast.success("Perfil actualizado", { duration: 2000, });

                    switch (red) {
                        case "tiktok":
                            setNewRed({ ...newRed, tiktok: "" })
                            break;
                        case "instagram":
                            setNewRed({ ...newRed, instagram: "" })
                            break;
                        case "x":
                            setNewRed({ ...newRed, x: "" })
                            break;
                        case "whatsapp":
                            setNewRed({ ...newRed, whatsapp: "" })
                            break;
                        case "linkedin":
                            setNewRed({ ...newRed, linkedin: "" })
                            break;
                        case "facebook":
                            setNewRed({ ...newRed, facebook: "" })
                            break;
                        default:
                    }

                } catch (error) {
                    toast.error("No se pudo actualizar el perfil", { duration: 2000, })
                }
            }
        } catch (error) {
            toast.error("No se pudo actualizar el perfil", { duration: 2000, })
        }
    }

    const handleChangeAccess = async () => {
        const userInfo = await readUser(userData.uid);
        let state;
        if (userInfo.access === 'admin') {
            userInfo.access = 'user';
            state = "user";
        } else if (userInfo.access === 'user') {
            userInfo.access = 'admin';
            state = "admin";
        }

        try {
            await updateUser(userInfo);
            toast.error("Nivel de acceso cambiado a " + state, { duration: 2000, });
        } catch {
            toast.error("No se pudo modificar el nivel acceso", { duration: 2000, });
        }
    }

    const handleNext = (index) => {
        if (index >= (fotosLiked.length - 1)) {
            setSelectedPhoto(0);
        } else {
            setSelectedPhoto(index + 1);
        }
    }

    const handleBefore = (index) => {
        if (index <= 0) {
            setSelectedPhoto(fotosLiked.length - 1);
        } else {
            setSelectedPhoto(index - 1);
        }
    }

    const handleUpdatePhoto = async (profilePic) => {

        try {
            if (profilePic) {
                await toast.promise(
                    (async () => {
                        await savePhoto(`users/${userUid}`, profilePic);
                        const updatedPhoto = await readURLImg(`users/${userUid}`);

                        const currentUserData = await readUser(userUid);
                        currentUserData.photoURL = updatedPhoto;
                        await updateUser(currentUserData);

                        const timer = setTimeout(() => {
                            setReLoad(prevCount => prevCount + 1);
                            clearTimeout(timer);
                        }, 5000);
                    })(),
                    {
                        loading: 'Subiendo la foto...',
                        success: 'Foto actualizada con éxito!',
                        error: 'Ocurrió un error al actualizar la foto.',
                    }

                );
            }
        } catch (error) {
            console.log(error);
        }
    }

    if (!userData || !design || !fotosLiked) {
        return (
            <>
                <Loading />
            </>
        )
    }

    // Editar Perfil

    if (state === 1) {
        return (
            <>
                <div className='back'>
                    <div className='layout'{...handleSwipe}>
                        <Toaster containerStyle={{ position: 'fixed', top: '11vh', right: '2vw', zIndex: '9999' }} {...toastOptions()} reverseOrder={true} />

                        <div className='editBannerProf'                    >
                            <button className='backEdit' onClick={() => { setState(0) }}><img src={design["before"].url} alt='Cerrar Foto' className='cerrarPhotoImg' />Volver</button>
                            <button className='adminChanger' onClick={() => { handleChangeAccess() }}><img src={design["navProfile"].url} alt='Cerrar Foto' className='cerrarPhotoImg' />{userData.access}</button>

                            <form className='roundedPicDiv'>
                                <input type="file" id="imagen" name="imagen" accept="image/*" onChange={(event) => { handleUpdatePhoto(event.target.files[0]) }} style={{ display: 'none' }} />
                                <label htmlFor="imagen" className="editPhotoProfCont">
                                    <img id="editPhoto" src={design["profEdit"].url} alt='profilePic' className='editPhotoProf' />
                                    <img src={userData.photoURL.replace("s96-c", "s400-c")} alt='profilePic' className='roundedProfilePic' />
                                </label>

                            </form>

                            <form className='editBannerNameCont' onSubmit={handleSaveNewName}>
                                <div className='bannerInputCont'>
                                    <label htmlFor="name">Nombre</label>
                                    <input className="bannerInput" id="name" placeholder={userData.displayName} value={newName} onChange={(e) => setNewName(e.target.value)} />
                                    <button type="submit" className="saveBannerBtn"><img alt="edit icon" src={design["next"].url} className="flecha" /></button>
                                </div>
                            </form>
                            <form className='editBannerNameCont' onSubmit={handleSaveProfesion}>
                                <div className='bannerInputCont'>
                                    <label htmlFor="profesion">Profesión</label>
                                    <input className="bannerInput" id="profesion" placeholder={userData.profesion ? userData.profesion : null} value={newProfesion} onChange={(e) => setNewProfesion(e.target.value)} />
                                    <button type="submit" className="saveBannerBtn"><img alt="edit icon" src={design["next"].url} className="flecha" /></button></div>
                            </form>
                        </div>
                        <div className='editInfo'>
                            <form className='ref' onSubmit={handleSaveTikTok}>
                                <label htmlFor="tk">  <img className="refPic" alt="ref" src={design["tiktok"].url} /></label>
                                <div className='refDescCont'>
                                    <label htmlFor='tk' className='redNameLabel'><h2 className='refDesc'>Tik Tok</h2></label>
                                    <input className='bannerInput' value={newRed.tiktok} onChange={(e) => setNewRed({ ...newRed, tiktok: e.target.value })} id="tk" placeholder={userData.redes.tiktok ? userData.redes.tiktok : "Usuario"} />
                                    <button type="submit" className="saveBannerBtn"><img className="flecha" alt="flecha" src={design["next"].url} /></button>
                                </div>
                            </form>
                            <form className='ref' onSubmit={handleSaveLinkedin}>
                                <label htmlFor="ln">  <img className="refPic" alt="ref" src={design["linkedin"].url} /></label>
                                <div className='refDescCont'>
                                    <label htmlFor='ln' className='redNameLabel'><h2 className='refDesc'>Linkedin</h2></label>
                                    <input className='bannerInput' value={newRed.linkedin} onChange={(e) => setNewRed({ ...newRed, linkedin: e.target.value })} id="ln" placeholder={userData.redes.linkedin ? userData.redes.linkedin : "Usuario"} />
                                    <button type="submit" className="saveBannerBtn"><img className="flecha" alt="flecha" src={design["next"].url} /></button>
                                </div>
                            </form>
                            <form className='ref' onSubmit={handleSaveInstagram}>
                                <label htmlFor="ig"> <img className="refPic" alt="ref" src={design["instagram"].url} /></label>
                                <div className='refDescCont'>
                                    <label htmlFor='ig' className='redNameLabel'><h2 className='refDesc'>Instagram</h2></label>
                                    <input className='bannerInput' value={newRed.instagram} onChange={(e) => setNewRed({ ...newRed, instagram: e.target.value })} id="ig" placeholder={userData.redes.instagram ? userData.redes.instagram : "Usuario"} />
                                    <button type="submit" className="saveBannerBtn"><img className="flecha" alt="flecha" src={design["next"].url} /></button>
                                </div>
                            </form>
                            <form className='ref' onSubmit={handleSaveX}>
                                <label htmlFor="x">  <img className="refPic" alt="ref" src={design["x"].url} /></label>
                                <div className='refDescCont'>
                                    <label htmlFor='x' className='redNameLabel'><h2 className='refDesc'> X </h2></label>
                                    <input className='bannerInput' value={newRed.x} onChange={(e) => setNewRed({ ...newRed, x: e.target.value })} id="x" placeholder={userData.redes.x ? userData.redes.x : "Usuario"} />
                                    <button type="submit" className="saveBannerBtn"><img className="flecha" alt="flecha" src={design["next"].url} /></button>
                                </div>
                            </form>
                            <form className='ref' onSubmit={handleSaveWhatsApp}>
                                <label htmlFor="wpp"><img className="refPic" alt="ref" src={design["whatsapp"].url} /></label>
                                <div className='refDescCont'>
                                    <label htmlFor="wpp" className='redNameLabel'><h2 className='refDesc'>WhatsApp</h2></label>
                                    <input className='bannerInput' value={newRed.whatsapp} onChange={(e) => setNewRed({ ...newRed, whatsapp: e.target.value })} id="wpp" placeholder={userData.redes.whatsapp ? userData.redes.whatsapp : "Número"} />
                                    <button type="submit" className="saveBannerBtn"><img className="flecha" alt="flecha" src={design["next"].url} /></button>
                                </div>
                            </form>
                            <form className='ref' onSubmit={handleSaveFacebook}>
                                <label htmlFor="fb"> <img className="refPic" alt="ref" src={design["facebook"].url} /></label>
                                <div className='refDescCont'>
                                    <label htmlFor='fb' className='redNameLabel'><h2 className='refDesc'>Facebook</h2></label>
                                    <input className='bannerInput' value={newRed.facebook} onChange={(e) => setNewRed({ ...newRed, facebook: e.target.value })} id="fb" placeholder={userData.redes.facebook ? userData.redes.facebook : "Usuario"} />
                                    <button type="submit" className="saveBannerBtn"><img className="flecha" alt="flecha" src={design["next"].url} /></button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div >
            </>
        );

    }

    // Vista de fotos

    if (state === 2) {

        return (
            <>
                <div className='layProf' {...handleSwipe}>
                    <div className='profViewCont'>
                        <button className='cerrarPhotoBtn' onClick={() => { setState(0) }}><img src={design["close"].url} alt='Cerrar Foto' className='cerrarPhotoImgProf' /></button>
                        <div className='controls'>
                            <button className='controlBtn' onClick={() => { handleBefore(selectedPhoto) }}></button>
                            <button className='controlBtn' onClick={() => { handleNext(selectedPhoto) }}></button>
                        </div>
                        <img className='photoView borderRad' src={fotosLiked[selectedPhoto]} alt={`Foto ${selectedPhoto}`} />
                    </div>
                </div>
            </>
        )

    }

    // Vista del Perfil

    return (
        <>
            <div className='back'{...handleSwipe}>
                <div className='layout'>
                    <div className='bannerCont'>
                        <img src={design["profStyle"].url} alt='decoracion' className="bannerStyleImg" />
                        <img className='bannerStyleImg' alt="Estilo del banner" src={design["profStyle"].url} />
                        <div className='bannerInfo'>
                            <h1 className="bannerName">{userData.displayName}</h1>
                            <h2 className='bannerProf'>{userData.profesion ? userData.profesion : null}</h2>
                        </div>
                        {design["profStyle"].url ? <img src={userData.photoURL.replace("s96-c", "s400-c")} alt='profilePic' className='profileBannerPic' /> : null}
                    </div>
                    <div className='stats'>
                        <div className='stat'>
                            <h1 className='statNum'>{userData.photosTaken}</h1>
                            <h3 className='statName'>Fotos</h3>
                        </div>
                        <div className='statBorder'></div>
                        <div className='stat'>
                            <h1 className='statNum'>{userData.photosliked}</h1>
                            <h3 className='statName'>Likes</h3>
                        </div>
                        <div className='statBorder'></div>
                        <div className='stat'>
                            <h1 className='statNum'>{userData.eventsVisited}</h1>
                            <h3 className='statName'>Eventos</h3>
                        </div>
                        <div className='statBorder'></div>
                        <div className='stat '><button onClick={() => { setState(1) }} className='statButton'><img alt='ajustes' className='settings' src={design["profEdit"].url} /></button></div>
                    </div>
                    <div className="redesCont">
                        {userData.redes.instagram && (
                            <div className='redCont'>
                                <img className='logoRed' alt="Logo de Instagram" src={design["instagramBlack"].url} onClick={() => { openAppOrBrowser("instagram", userData.redes.instagram) }} />
                            </div>
                        )}
                        {userData.redes.facebook && (
                            <div className='redCont'>
                                <img className='logoRed' alt="Logo de Facebook" src={design["facebookBlack"].url} onClick={() => { openAppOrBrowser("facebook", userData.redes.facebook) }} />
                            </div>
                        )}
                        {userData.redes.whatsapp && (
                            <div className='redCont'>
                                <img className='logoRed' alt="Logo de WhatsApp" src={design["whatsappBlack"].url} onClick={handleWhatsAppClick} />
                            </div>
                        )}
                        {userData.redes.tiktok && (
                            <div className='redCont'>
                                <img className='logoRed' alt="Logo de TikTok" src={design["tiktokBlack"].url} onClick={() => { openAppOrBrowser("tiktok", userData.redes.tiktok) }} />
                            </div>
                        )}
                        {userData.redes.linkedin && (
                            <div className='redCont'>
                                <img className='logoRed' alt="Logo de Linkedin" src={design["linkedinBlack"].url} onClick={() => { openAppOrBrowser("linkedin", userData.redes.linkedin) }} />
                            </div>
                        )}
                        {userData.redes.x && (
                            <div className='redCont'>
                                <img className='logoRed' alt="Logo de X" src={design["xBlack"].url} onClick={() => { openAppOrBrowser("x", userData.redes.x) }} />
                            </div>
                        )}
                    </div>
                    <div className='myLikes' >
                        {fotosLiked.map((img, index) => (
                            <div className='myLikeCont' key={index} onClick={() => { setState(2); setSelectedPhoto(index); }}><img className='myLike' src={img} alt={`Foto ${index}`} /></div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );

}
