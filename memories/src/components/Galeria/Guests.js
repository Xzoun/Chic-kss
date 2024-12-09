import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext"

import '../../css/invitados.css'
import { listenToEvent, readEvent, readUser } from "../../firebase/firebaseDatabase";
import { Loading } from "../Loading";
import { useNavigate, useParams } from "react-router-dom";
import { Encrypt } from "../specialFunctions";

export function Guests() {
    const userUid = useUser().uid;
    const { event } = useParams();
    const [userData, setUserData] = useState(null);
    const [eventData, setEventData] = useState(null);
    const [guestsPhotos, setGuestsPhotos] = useState(null);
    const Navigate = useNavigate();
    const [reLoad, setReLoad] = useState(0);

    useEffect(() => {
        let timer;
        listenToEvent((hasChanges) => {
            if (hasChanges) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    setReLoad(prevCount => prevCount + 1);
                }, 5000);
            }
        }, event);

    }, [event]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userInfo = await readUser(userUid);
                const eventInfo = await readEvent(event);

                if (eventInfo && eventInfo.guests && userInfo) {
                    const guestsPhotos = await Promise.all(eventInfo.guests.map(async (uid, index) => {
                        if (uid && uid !== userUid) {
                            const usersInfo = await readUser(uid);

                            const user = {
                                uid: usersInfo.uid,
                                url: usersInfo.photoURL
                            }

                            return user;
                        }
                        return null;
                    }));

                    if (guestsPhotos) {
                        setGuestsPhotos(guestsPhotos);
                    }

                    if (userInfo) {
                        setUserData(userInfo);
                    }

                    if (eventInfo) {
                        setEventData(eventInfo);
                    }
                }
            } catch (error) {
                console.log(error);
            }


        }

        if (userUid) {
            fetchUser();
        }

    }, [reLoad, event, userUid]);

    const handleGoToProfile = (uid) => {
        const enctryptedUid = Encrypt(uid);
        Navigate(`/profile/${enctryptedUid}`)
    }

    if (!userData || !eventData || !guestsPhotos) {
        return (
            <Loading />
        )
    }

    return (
        <div className='cont'>
            <div className='fotoInvitadoCont'>
                {guestsPhotos.map((user, index) => (
                    user ? <button key={index} onClick={() => { handleGoToProfile(user.uid) }} className="userGuestBtn"><img className="userGuestPhoto" alt="user profile pic" src={user.url} /></button> : null
                ))}
            </div>
        </div>

    )
}