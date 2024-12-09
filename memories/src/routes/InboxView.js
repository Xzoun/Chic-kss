import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { getAllDesignPhotos, getAllEvents } from "../firebase/firebaseStorage";
import { chatExists, createChat, readEvent, readUser, getChatUid } from "../firebase/firebaseDatabase";
import { Loading } from '../components/Loading.js';
import { useUser } from '../context/UserContext.js';
import { Encrypt, format } from '../components/specialFunctions.js';
import '../css/chat.css'

export function InboxView() {
    const navigate = useNavigate();
    const userUid = useUser().uid;
    const [design, setDesign] = useState(null);
    const [newChatsList, setNewChatsList] = useState(null);
    const [currentChatsList, setCurrentChatsList] = useState(null);

    useEffect(() => {
        const fetchDesing = async () => {
            try {
                const fotos = await getAllDesignPhotos();
                setDesign(fotos);
            } catch (error) {
                console.log(error);
            }
        }

        fetchDesing();
    }, []);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const fetchedEvents = await getAllEvents();
                const currentDate = new Date();

                const potentialChatsList = [];
                const existentChatsList = [];

                await Promise.all(fetchedEvents.map(async eventUid => {
                    const eventData = await readEvent(eventUid);

                    if (eventData) {
                        const eventEndDate = new Date(eventData.fin);
                        eventEndDate.setHours(eventEndDate.getHours() + 48);

                        if (eventEndDate > currentDate) {
                            await Promise.all(eventData.guests.map(async guestUid => {
                                const guestInfo = await readUser(guestUid);

                                if (guestInfo && userUid && guestUid !== userUid) {
                                    const currentChat = await chatExists(guestUid, userUid);
                                    const fin = format(eventEndDate);
                                    const currentGuest = {
                                        id: guestUid,
                                        uid: guestUid,
                                        name: guestInfo.displayName,
                                        profesion: guestInfo.profesion ? guestInfo.profesion : null,
                                        url: guestInfo.photoURL,
                                        fin: fin
                                    };

                                    if (!currentChat) {
                                        potentialChatsList.push(currentGuest);
                                    } else {
                                        existentChatsList.push(currentGuest);
                                    }
                                }
                            }));
                        } else {
                            console.log("borrar chat");
                        }
                    }
                }));

                const uniquePotentialChats = potentialChatsList.filter((chat, index, self) =>
                    index === self.findIndex(c => (
                        c.id === chat.id
                    ))
                );

                const uniqueExistentChats = existentChatsList.filter((chat, index, self) =>
                    index === self.findIndex(c => (
                        c.id === chat.id
                    ))
                );

                setNewChatsList(uniquePotentialChats);
                setCurrentChatsList(uniqueExistentChats);

            } catch (error) {
                console.error('Error al obtener los datos de eventos:', error);
            }
        };

        fetchChats();

    }, [userUid]);

    const handleCreateNewChat = async (chatInfo) => {
        try {

            const newChat = {
                user: userUid,
                user2: chatInfo.uid,
                fin: chatInfo.fin
            }
            const chatUid = await createChat(newChat);
            const encryptedChatUid = Encrypt(chatUid);
            navigate(`/chats/${encryptedChatUid}`);

        } catch (error) {
            console.log(error);
        }
    }

    const handleOpenChat = async (chatSelected) => {
        try {
            const chatUid = await getChatUid(userUid, chatSelected.uid);
            const encryptedChatUid = Encrypt(chatUid);
            navigate(`/chats/${encryptedChatUid}`);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    const handlerView = useSwipeable({
        onSwipedLeft: () => navigate("/settings"),
        onSwipedRight: () => navigate("/home")
    });

    if (!design || (!newChatsList && !currentChatsList)) {
        return <Loading />;
    }

    return (
        <div className='back' >
            <div className="layout">
                {(newChatsList && newChatsList.length > 0) || (currentChatsList && currentChatsList.length > 0) ? <>

                    {(newChatsList && newChatsList.length > 0) ? <>

                        <div className='fotoInvitadoCont'>

                            {newChatsList.map((user, index) => (
                                user ?
                                    <button key={index} onClick={() => { handleCreateNewChat(user) }} className="userGuestBtn">
                                        <img className="userGuestPhoto" alt="user profile pic" src={user.url} />
                                    </button>
                                    : null
                            ))}

                        </div>

                    </> : null}

                    {(currentChatsList && currentChatsList.length > 0) ? <>
                        <div className='chatListCont' {...handlerView}>
                            {currentChatsList.map((user, index) => (
                                user ?
                                    <button key={index} onClick={() => { handleOpenChat(user) }} className="openChatBtn">
                                        <img className="userGuestPhoto" alt="user profile pic" src={user.url} />
                                        <div className="openChatBtnInfo">
                                            <h2>{user.name}</h2>
                                            <h3>{user.profesion ? user.profesion : null}</h3>
                                        </div>
                                        <p>El chat se eliminará el: {user.fin}</p>
                                    </button>
                                    : null
                            ))}
                        </div>
                    </> :
                        <h2 className="empty">No hay chats actualmente</h2>}

                </> : <>
                    <h2 className="empty">No hay eventos recientes</h2>
                </>}
            </div>
        </div >
    );

}