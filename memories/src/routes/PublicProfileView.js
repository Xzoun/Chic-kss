import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loading } from "../components/Loading";
import { getPhotoLikes, guestExists, listenToUser, readEvent, readUser } from "../firebase/firebaseDatabase";
import { useSwipeable } from "react-swipeable";
import { getAllDesignPhotos, getAllEvents, readURLImg } from "../firebase/firebaseStorage";
import { DeCrypt } from "../components/specialFunctions";

import '../css/publicProfile.css';

export function PublicProfileView() {
    const { encryptedUid } = useParams();
    const [deCryptedUid, setDecryptedUid] = useState(null);
    const [userData, setUserData] = useState(null);
    const [state, setState] = useState(0);
    const [selectedPhoto, setSelectedPhoto] = useState(0);
    const [fotosTaken, setFotosTaken] = useState(null);
    const [design, setDesign] = useState(null);
    const [reLoad, setReLoad] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        let timer;

        listenToUser((hasChanges) => {
            if (hasChanges) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    setReLoad(prevCount => prevCount + 1);
                }, 2000);

            }
        }, deCryptedUid);

    }, [deCryptedUid]);

    useEffect(() => {
        const fetchDesgign = async () => {
            const fotos = await getAllDesignPhotos();
            setDesign(fotos);
        }

        let deCryptedUid = DeCrypt(encryptedUid);
        setDecryptedUid(deCryptedUid);
        fetchDesgign();

    }, [encryptedUid]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {

                const fetchedEvents = await getAllEvents();
                const userInfo = await readUser(deCryptedUid);

                let eventsVisitedCount = 0,
                    photosTakenCount = 0;
                const photosLiked = [];

                await Promise.all(fetchedEvents.map(async uid => {
                    const eventData = await readEvent(uid);
                    const guest = await guestExists(eventData, deCryptedUid);

                    if (userInfo && guest) {
                        eventsVisitedCount++;

                        if (eventData && eventData.fotos) {
                            await Promise.all(eventData.fotos.map(async foto => {
                                try {
                                    const likes = await getPhotoLikes(eventData.uid, foto.uid);

                                    if (Array.isArray(likes)) {
                                        await Promise.all(likes.map(async uid => {
                                            if (uid === deCryptedUid) {
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
                setFotosTaken(photosLiked);
            } catch (error) {
                console.error('Error al obtener los datos de eventos:', error);
            }
        };

        if (deCryptedUid) {
            fetchUserData();
        }
    }, [reLoad, deCryptedUid]);

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

    const handleNext = (index) => {
        if (index >= (fotosTaken.length - 1)) {
            setSelectedPhoto(0);
        } else {
            setSelectedPhoto(index + 1);
        }
    }

    const handleBefore = (index) => {
        if (index <= 0) {
            setSelectedPhoto(fotosTaken.length - 1);
        } else {
            setSelectedPhoto(index - 1);
        }
    }

    if (!userData || !design) {
        return (
            <Loading />
        )
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
                        <img className='photoView borderRad' src={fotosTaken[selectedPhoto]} alt={`Foto ${selectedPhoto}`} />
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
                    <div className='publicBannerInfo'>
                        <h1 className="profName">{userData.displayName}</h1>
                        <h2 className='profProfesion'>{userData.profesion ? userData.profesion : null}</h2>
                    </div>
                    <div className='bannerCont'>
                        <img src={userData.photoURL.replace("s96-c", "s400-c")} alt='profilePic' className='publicProfilePic' />
                        <div className="publicRedesCont">
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
                    </div>

                    <div className='publicLikes' >
                        {fotosTaken.map((img, index) => (
                            <div className='publicLikeCont' key={index} onClick={() => { setState(2); setSelectedPhoto(index); }}>
                                <img className='publicLike' src={img} alt={`Foto ${index}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}