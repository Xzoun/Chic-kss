import React, { useState, useEffect } from "react";

import { Navigate } from "react-router-dom";

import { signInWithPopup } from 'firebase/auth';
import { createUser, userExists } from '../firebase/firebaseDatabase.js';
import { auth, googleAuthProvider } from '../firebase/firebaseConfig.js';

import '../css/register.css';
import { getAllDesignPhotos } from "../firebase/firebaseStorage.js";
import { Encrypt } from "./specialFunctions.js";

export function RegisterView() {

    const [authenticated, setAuthenticated] = useState(false);
    const [design, setDesign] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const fotos = await getAllDesignPhotos();
            setDesign(fotos);
        }

        fetchUserData();
    }, []);

    useEffect(() => {

        const token = localStorage.getItem('token');
        if (token) {
            setAuthenticated(true);
        } else {
            setAuthenticated(false);
        }
    }, []);

    const handleSignInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleAuthProvider);
            const token = result.user.accessToken;
            const userUid = result.user.uid;
            const encryptedToken = Encrypt(token);
            localStorage.setItem("token", encryptedToken);

            setAuthenticated(true);

            const userData = {
                displayName: result.user.displayName,
                uid: result.user.uid,
                photoURL: result.user.photoURL,
                eventos: [],
                redes: { whatsapp: "", facebook: "", instagram: "", x: "", tiktok: "", linkedin: "" },
            };

            const existingUser = await userExists(userUid);

            if (!existingUser) {
                userData.access = "user";
                try {
                    await createUser(userUid, userData);
                } catch (error) {
                    console.log("Error al crear usuario:", error);
                }
            }

        } catch (error) {
            console.log(error);
        }
    }

    if (authenticated) {
        const event = localStorage.getItem('event');

        if (event) {
            return <Navigate to={`/${event}`} />;
        }
        return <Navigate to={'/home'} />;
    }

    if (design) {
        return (
            <div className='back'>
                <div className="layout ">
                    <div className='registerLayout'>
                        <h1>Bienvenido</h1>
                        <div className="indicadorBtnCont">
                            <h3>Para continuar debes autenticarte</h3>
                            <button onClick={handleSignInWithGoogle} >Autenticarme</button>
                        </div>
                        <div className="logosCont" >
                            <img alt="logo de Google" src={design["logoGoogle"].url} className="logo" />
                            <img alt="logo de Chic-kss" src={design["logoChic"].url} className="logo" />
                            <img alt="logo de LeBenitez" src={design["logoLEB"].url} className="logo" />
                        </div>

                    </div>
                </div>
            </div>
        )
    }
}