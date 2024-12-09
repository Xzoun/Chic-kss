import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useParams } from 'react-router-dom';
import { readURLImg } from '../../firebase/firebaseStorage.js';
import { useUser } from '../../context/UserContext.js';
import { Loading } from '../Loading.js';

export function Portada() {
    const { event } = useParams();
    const uid = useUser().uid;
    const [portada, setPortada] = useState(null);
    const [qr, setQr] = useState('');

    useEffect(() => {
        async function fetchData() {
            const portada = await readURLImg(`events/${event}/portada`);
            const qr = await QRCode.toDataURL(`diezsnaps.web.app/${event}`, { errorCorrectionLevel: 'H' });

            setQr(qr);
            setPortada(portada);
        }
        fetchData();
    }, [event, uid]);

    if(!portada){
        return(
            <Loading />
        )
    }

    return (
        <>
            <div className='flexY'>
                
                <div className='flexYChild'>
                    <img className='portada' alt="portada del evento" src={portada} />
                </div>

                <div className="flexYChild">
                    <a href={qr} download >
                        <img alt="Codigo QR del Evento" className="qr" src={qr} />
                    </a>
                    <h3>Descargá y compartí el QR con los invitados del evento!</h3>
                </div>
            </div>

        </>
    )
}