import React, { useState, useEffect } from 'react';

import { Navigate } from 'react-router-dom';
import '../css/opening.css';

const OpeningComponent = () => {

    const [state, setState] = useState(0);

    useEffect(() => {

        const delay = 2000;
        const delay2 = 3500;
        const delay3 = 6000;

        const timer = setTimeout(() => {
            setState(1)
        }, delay);

        const timer2 = setTimeout(() => {
            setState(2)
        }, delay2);

        const timer3 = setTimeout(() => {
            setState(3)
        }, delay3);

        return () => {
            clearTimeout(timer);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    if (state === 0) {
        return (
            <div className="back">
                <div className={`layoutOpening`}>
                    <div className='logoAppFlex'>
                        <div className="logoContainer">
                            <div className="logoImageEffect"></div>
                        </div>
                        <h3 className="center hidden caveat bold big">Memories</h3>
                    </div>
                </div>
            </div>
        )
    }

    if (state === 1) {
        return (
            <div className="back">
                <div className={`layoutOpening`}>
                    <div className="logoAppFlex">
                        <div className="logoContainer">
                            <div className="logoImage"></div>
                        </div>
                        <h3 className="center fadeIn caveat bold big">Memories</h3>
                    </div>
                </div>
            </div>
        )
    }

    if (state === 2) {
        return (
            <div className="back">
                <div className={`layoutOpening `}>

                    <div className="logoAppFlex fadeOut">
                        <div className="logoContainer">
                            <div className="logoImage"></div>
                        </div>
                        <h3 className="center caveat bold big">Memories</h3>
                    </div>
                    <div className="leoLogoContainer fadeOut" >
                        <div className="leoLogo"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (state === 3) {
        return (
            <>
                {<Navigate to='/home' />}
            </>
        )
    };
}

export default OpeningComponent;