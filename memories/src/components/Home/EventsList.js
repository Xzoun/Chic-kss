import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { readEvent, listenToEvents } from '../../firebase/firebaseDatabase.js';
import { getAllDesignPhotos, getAllEvents, readURLImg } from '../../firebase/firebaseStorage.js';

import { Loading } from '../Loading.js';
import { format } from '../specialFunctions.js'
import { useSwipeable } from "react-swipeable";

import '../../css/galeria.css';

export function EventsList() {
    const [currentEvents, setCurrentEvents] = useState(null);
    const [finishedEvents, setFinishedEvents] = useState(null);
    const [state, setState] = useState(0);
    const [reLoad, setReLoad] = useState(0);
    const navigate = useNavigate();
    const [design, setDesign] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const fotos = await getAllDesignPhotos();
            setDesign(fotos);
        }

        fetchUserData();
    }, []);

    useEffect(() => {

        listenToEvents((hasChanges) => {
            if (hasChanges) {
                let timer;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    setReLoad(prevCount => prevCount + 1);
                }, 2000);
            }
        });

    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fetchedEvents = await getAllEvents();

                const eventsWithInfo = await Promise.all(fetchedEvents.map(async uid => {
                    const route = `events/${uid}/portada`;
                    const imgUrl = await readURLImg(route);
                    const eventData = await readEvent(uid);

                    if (eventData) {
                        const inicio = format(eventData.inicio);
                        const final = format(eventData.fin);
                        const fotos = eventData.fotos ? eventData.fotos.length : 0;

                        return {
                            uid: eventData.uid,
                            url: imgUrl,
                            title: eventData.name,
                            inicio: inicio,
                            final: final,
                            finalNoFormat: eventData.fin,
                            fotos: fotos - 1
                        };
                    } else {
                        return null;
                    }
                }));

                const currentDate = new Date();
                const currentEventsList = [];
                const finishedEventsList = [];

                eventsWithInfo.forEach(event => {
                    if (event) {
                        const eventFinalDate = new Date(event.finalNoFormat);
                        if (eventFinalDate > currentDate) {
                            currentEventsList.push(event);
                        } else {
                            finishedEventsList.push(event);
                        }
                    }
                });

                setCurrentEvents(currentEventsList);
                setFinishedEvents(finishedEventsList);

            } catch (error) {
                console.error('Error al obtener los datos de eventos:', error);
            }
        };

        fetchData();
    }, [reLoad]);

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
                <div className='holder'></div>
                {currentEvents && currentEvents.length > 0 && (
                    <div className='padding'>
                        <div className='eventBtnCont'>
                            <button className='eventBtn' onClick={() => { setState(0) }}>
                                <img className='eventBtnImg' alt='flecha' src={design["current"].url}></img>
                            </button>
                        </div>
                    </div>
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

                <div className='holder'></div>

                {finishedEvents && finishedEvents.length > 0 && (

                    <div className='padding'>
                        <div className='eventBtnCont'>
                            <button className='eventBtn' onClick={() => { setState(1) }}>
                                <img className='eventBtnImg' alt='flecha' src={design["finished"].url} />
                            </button>
                        </div>
                    </div>

                )}

                {currentEvents && currentEvents.length > 0 && (
                    <div className='padding holder'>
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