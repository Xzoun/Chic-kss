import React, { useState, useEffect } from "react";
import QRCode from 'qrcode';

import { createEvent, createPortada } from '../../firebase/firebaseDatabase.js';
import { getAllDesignPhotos, savePhoto } from '../../firebase/firebaseStorage.js';

import { Loading } from "../Loading.js";
import { useUser } from "../../context/UserContext.js";

import '../../css/evento.css';
import { Toaster, toast } from "react-hot-toast";
import { toastOptions } from '../specialFunctions.js';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from "react-swipeable";

export function CrearEvento() {
    const [codigo, setCodigo] = useState(null);
    const [state, setState] = useState(0);
    const [evento, setEvento] = useState('');
    const [portada, setPortada] = useState(null);
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [qr, setQr] = useState('');
    const uid = useUser().uid;
    const [eventCreated, setEventCreated] = useState('');
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

        const fechaInicioInput = document.getElementById("fechaInicio");
        if (fechaInicioInput) {
            fechaInicioInput.addEventListener("change", function () {
                setFechaInicio(this.value);
            });
        }

    }, []);

    const handlerView = useSwipeable({
        onSwipedLeft: () => navigate("/inbox"),
        onSwipedRight: () => navigate("/profile")
    });

    const handleCrearQR = async (e) => {

        e.preventDefault();

        if (!evento || !fechaInicio || !fechaFin || portada == null) {
            toast.error("Completá todos los campos para crear un Evento.",
                { duration: 2000, }
            );
            return;
        }

        try {
            const codigoUnico = new Date().getTime();
            const qr = await QRCode.toDataURL(`diezsnaps.web.app/${codigoUnico}`, { errorCorrectionLevel: 'H' });
          
            setQr(qr);

            const newEvent = {
                name: evento,
                uid: codigoUnico,
                inicio: fechaInicio,
                fin: fechaFin,
                guests: [uid]
            }

            const promise = toast.promise(
                createEvent(newEvent).then(() => {                   
                    return savePhoto(`events/${codigoUnico}/portada`, portada);
                }),
                {
                    loading: 'Creando el Evento...',
                    success: 'Evento creado con éxito!',
                    error: 'Ocurrió un error durante la creación del evento.',
                }
            );

            await promise;
            
            await createPortada(codigoUnico, uid);
            setCodigo(codigoUnico);
            setEventCreated(evento);

            setEvento('');
            setPortada(null);
            setFechaInicio('');
            setFechaFin('');

        } catch (error) {
            console.log(error);
        }
    }

    const handleFechaInicioChange = (e) => {
        const ahora = new Date();
        const ahoraString = ahora.toISOString().slice(0, 16);

        if (ahoraString > e.target.value) {
            e.target.value = ahoraString;
        }

        setFechaInicio(e.target.value);

        if (fechaFin < e.target.value) {
            setFechaFin(e.target.value);
        }
    };

    const handleCargarPortada = (e) => {
        if (e) {
            setPortada(e)
            toast.success("Imágen cargada", { duration: 2000, });
        } else {
            toast.error("No se pudo cargar la imágen", { duration: 2000, })
        }
    }

    const handleFechaFinChange = (e) => {
        const ahora = new Date();
        const ahoraString = ahora.toISOString().slice(0, 16);

        if (ahoraString > e.target.value) {
            e.target.value = ahoraString;
        }

        setFechaFin(e.target.value);

        if (e.target.value < fechaInicio) {
            setFechaInicio(e.target.value);
        }
    };

    const handleOpenForm = () => {
        if (state === 1) {
            setState(0)
        } else if (state === 0) {
            setState(1)
        }
    }

    if (!design) {
        return (
            <>
                <Loading />
            </>
        )
    }

    return (
        <>
            <div {...handlerView}>
                <button type="submit" className="openFormBtn" onClick={() => { handleOpenForm() }}><img alt="Crear Álbum" src={design["createAlbum"].url} className="icon" /></button>
            </div>
            {state === 1 ? (<>
                <div className="flexY">
                    <div className="flexYChild">
                        <div className='holder'></div>
                        <div>
                            <Toaster containerStyle={{ position: 'fixed', top: '11vh', right: '2vw', zIndex: '9999' }}  {...toastOptions()} reverseOrder={true} />
                            <form className="formCrearEvent" onSubmit={handleCrearQR}>
                                <div className="bloque">
                                    <label htmlFor="nombre">Nombre del evento</label>
                                    <input id="nombre" name="nombre" type="text" value={evento} onChange={(e) => setEvento(e.target.value)} className='input' />
                                </div>
                                <div className="bloque">
                                    <label htmlFor="fechaInicio">Inicio de Evento</label>
                                    <input className='input' type="datetime-local" id="fechaInicio" name="fechaInicio" value={fechaInicio} onChange={handleFechaInicioChange} />
                                </div>
                                <div className="bloque">
                                    <label htmlFor="fechaFin">Final de Evento</label>
                                    <input className='input' type="datetime-local" id="fechaFin" name="fechaFin" value={fechaFin} onChange={handleFechaFinChange} />
                                </div>
                                <div className="bloque">
                                    <label htmlFor="imagen">Portada</label>
                                    <input type="file" id="imagen" name="imagen" accept="image/*" onChange={(event) => { handleCargarPortada(event.target.files[0]) }} style={{ display: 'none' }} />
                                    <label htmlFor="imagen" className="custom-file-upload">
                                        <img className="icon" src={design["createPhoto"].url} alt="Agregar imágen" />
                                    </label>
                                </div>
                                <div className="bloque">
                                    <button type="submit" className="eventBtn"><img alt="Crear Álbum" src={design["createAlbum"].url} className="icon" /></button>
                                </div>
                            </form>
                        </div>
                        {codigo ? (
                            <div className="relativeRight">
                                <img className="icon" alt={"ver Codigo QR"} src={design["next"].url} />
                            </div>) : null
                        }

                    </div>
                    {codigo ? (
                        <div className="flexYChild">
                            <h2>{eventCreated}</h2>
                            <a href={qr} download >
                                <img alt="Codigo QR del Evento" className="qr" src={qr} />
                            </a>
                            <h3>Descargá y compartí el QR con los invitados del evento!</h3>
                        </div>) : null
                    }
                </div >
            </>) : null}
        </>
    )
}