import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { format } from '../specialFunctions.js';
import { listenToEvents, readEvent } from '../../firebase/firebaseDatabase.js';
import { getAllDesignPhotos, getAllEvents, readURLImg } from '../../firebase/firebaseStorage.js';

import { Loading } from '../Loading.js';
import { useUser } from '../../context/UserContext.js';
import { useSwipeable } from 'react-swipeable';

export function MyEvents() {
    const [currentEvents, setCurrentEvents] = useState(null);
    const [finishedEvents, setFinishedEvents] = useState(null);
    const navigate = useNavigate();
    const userUid = useUser().uid;
    const [state, setState] = useState(0);
    const [reLoad, setReLoad] = useState(0);
    const [design, setDesign] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fetchedEvents = await getAllEvents();

                const eventsWithInfo = await Promise.all(fetchedEvents.map(async uid => {
                    const route = `events/${uid}/portada`;
                    const imgUrl = await readURLImg(route);
                    const eventData = await readEvent(uid);

                    if (eventData && eventData.guests) {
                        let inicio = format(eventData.inicio);
                        let final = format(eventData.fin);
                        const fotos = eventData.fotos ? eventData.fotos.length : 0;

                        const eventInfo = {
                            uid: eventData.uid,
                            url: imgUrl,
                            title: eventData.name,
                            inicio: inicio,
                            final: final,
                            finalNoFormat: eventData.fin,
                            guests: eventData.guests,
                            fotos: fotos
                        };

                        return eventInfo;
                    }
                }));

                const currentDate = new Date();
                let currentEvents = [];
                let finishedEvents = [];

                eventsWithInfo.forEach(event => {
                    if (event) {
                        const eventFinalDate = new Date(event.finalNoFormat);

                        if (eventFinalDate > currentDate) {
                            if (event.guests && event.guests.includes(userUid)) {
                                currentEvents.push(event);
                            }
                        } else {
                            if (event.guests && event.guests.includes(userUid)) {
                                finishedEvents.push(event);
                            }
                        }
                    }
                });

                setCurrentEvents(currentEvents);
                setFinishedEvents(finishedEvents);
            } catch (error) {
                console.log('Error al obtener los datos:', error);
            }
        };

        fetchData();
    }, [userUid, reLoad]);

    useEffect(() => {
        let timer;
        listenToEvents((hasChanges) => {
            if (hasChanges) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    setReLoad(prevCount => prevCount + 1);
                }, 2000);
            }
        });

    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            const fotos = await getAllDesignPhotos();
            setDesign(fotos);
        }

        fetchUserData();
    }, []);

    const handlerView = useSwipeable({
        onSwipedLeft: () => navigate("/inbox"),
        onSwipedRight: () => navigate("/profile")
    });

    if (!currentEvents && !finishedEvents) {
        return <Loading />;
    }

    if (state === 1) {

        return (
            <div  {...handlerView}>
                {currentEvents && currentEvents.length > 0 && (

                    <button className='eventBtn' onClick={() => { setState(0) }}>
                        <img className='eventBtnImg' alt='flecha' src={design["current"].url}></img>
                    </button>

                )}

                {finishedEvents && finishedEvents.length > 0 && (
                    <div className='padding'>
                        <div className="eventList" >
                            {finishedEvents.map((event, index) => (
                                <div key={index} className='eventContEventList' onClick={() => navigate(`/${event.uid}`)}>
                                    <img className="photoEventList" src={event.url} alt={`Evento ${index}`} />
                                    <div className='eventInfoEventList'>
                                        <h3>{event.title}</h3>
                                        <p>Fin: {event.final}</p>
                                        <p>{event.fotos === 1 ? `${event.fotos} foto.` : `${event.fotos} fotos.`}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {
                    (!currentEvents || currentEvents.length === 0) && (!finishedEvents || finishedEvents.length === 0) && (
                        <div className='padding marginBot'>
                            <h2 className="empty">No se registran eventos!</h2>
                        </div>
                    )
                }
            </div >
        );
    }

    if (design) {
        return (

            < div  {...handlerView}>
                {finishedEvents && finishedEvents.length > 0 && (
                    <button className='eventBtn' onClick={() => { setState(1) }}>
                        <img className='eventBtnImg' alt='flecha' src={design["finished"].url}></img>
                    </button>

                )}

                {currentEvents && currentEvents.length > 0 && (
                    <div className='padding'>
                        <div className="eventList" >
                            {currentEvents.map((event, index) => (
                                <div key={index} className='eventContEventList' onClick={() => navigate(`/${event.uid}`)}>
                                    <img className="photoEventList" src={event.url} alt={`Evento ${index}`} />
                                    <div className='eventInfoEventList'>
                                        <h3>{event.title}</h3>
                                        <p>Inicio: {event.inicio}</p>
                                        <p>{event.fotos === 1 ? `${event.fotos} foto.` : `${event.fotos} fotos.`}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(!currentEvents || currentEvents.length === 0) && (
                    <div className='padding marginBot'>
                        <h2 className="empty">No hay eventos actuales</h2>
                    </div>
                )}
            </div>
        );
    }
}


