import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAllDesignPhotos } from "../../firebase/firebaseStorage";
import { Loading } from "../Loading";
import { createMessage, listenForNewMessages, loadChat, loadChatMessages, readUser } from "../../firebase/firebaseDatabase";
import { DeCrypt, Encrypt } from "../specialFunctions";
import { useSwipeable } from "react-swipeable";
import { useUser } from "../../context/UserContext";

export function ChatRoom() {
    const navigate = useNavigate();
    const { encryptedChatUid } = useParams();
    const userUid = useUser().uid;
    const [design, setDesign] = useState(null);
    const [chat, setChat] = useState(null);
    const [user2, setUser2] = useState(null);
    const [user, setUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesDiv = useRef(null);

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
        const fetchChatInfo = async () => {
            const DecryptedChatUid = DeCrypt(encryptedChatUid);
            const chatInfo = await loadChat(DecryptedChatUid);
            setChat(chatInfo);

            const userX = await readUser(chatInfo.user);
            const userX2 = await readUser(chatInfo.user2);

            if (userUid === chatInfo.user) {
                setUser(userX);
                setUser2(userX2);
            } else if (userUid === chatInfo.user2) {
                setUser(userX2);
                setUser2(userX);
            }
        }

        fetchChatInfo();
    }, [encryptedChatUid, userUid]);

    useEffect(() => {
        if (!chat) return;

        const handleNewMessages = async (hasChanges) => {
            if (hasChanges) {
                try {
                    const newMessages = await loadChatMessages(chat.uid);
                    console.log(newMessages);

                    const messagesArray = Object.values(newMessages);
                    const currentMessageIds = new Set(messages.map(message => message.id));
                    const filteredNewMessages = messagesArray.filter(message => !currentMessageIds.has(message.id));

                    if (filteredNewMessages.length > 0) {
                        setMessages(prevMessages => {
                            const allMessages = [...prevMessages, ...filteredNewMessages];
                            const uniqueMessages = Array.from(new Map(allMessages.map(msg => [msg.id, msg])).values());
                            return uniqueMessages;
                        });
                    }
                } catch (error) {
                    console.log('Error loading new messages:', error);
                }
            }
        };

        listenForNewMessages(handleNewMessages, chat.uid);

    }, [chat]);

    console.log(messages);
    const handleCloseChat = useSwipeable({
        onSwipedRight: () => {
            navigate("/inbox");
        }
    });

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() !== '') {
            try {
                await createMessage(newMessage, chat.uid, user.uid);
                setNewMessage('');
            } catch (error) {
                console.log("No se puede enviar el msj");
                console.log(error);
            }
        }
    };

    const handleGoToProfile = (uid) => {
        const encryptedUid = Encrypt(uid);
        navigate(`/profile/${encryptedUid}`);
    }

    if (design) {
        return (<>
            {messages.length > 0 && user2 ?
                <div className='back' {...handleCloseChat}>
                    <div className="layout">
                        <div className="chatName">
                            <button className="profLink" onClick={() => { handleGoToProfile(user2.uid) }}>
                                <img className="profLinkImg" alt="profilePic" src={user2.photoURL} />
                                <h2 >{user2.displayName}</h2></button>
                        </div>
                        <div className="chatWindow">
                            <div className="messages" ref={messagesDiv}>
                                <ol>{messages && user2 ?
                                    messages.length < 2 ? (
                                        messages.map((messageX) => (
                                            <div className="messageChatDiv" key={messageX.id}>
                                                <p className="emissary">{messageX.sender}:</p>
                                                <p className="message">{messageX.message}</p>
                                            </div>
                                        ))
                                    ) : (

                                        messages.map((messageX, index) => {

                                            if (index === 0) {
                                                return null;
                                            }

                                            const isFirstMessage = messages[index - 1].sender !== messageX.sender;
                                            const isLastMessage = index === messages.length - 1 || messages[index + 1].sender !== messageX.sender;

                                            const isUserMessage = messageX.sender === user.uid;
                                            return (
                                                <div className="messageDiv" key={messageX.id}>
                                                    {isFirstMessage ?
                                                        <>
                                                            {isUserMessage ?
                                                                <>
                                                                    <p className="meEmissary">{user.displayName}</p>
                                                                    <p className={isLastMessage ? "myFirstLastMessage" : "myFirstMessage"}>{messageX.message}</p>
                                                                </> : <>
                                                                    <p className="emissary">{user2.displayName}</p>
                                                                    <p className={isLastMessage ? "firstLastMessage" : "firstMessage"}>{messageX.message}</p>
                                                                </>
                                                            }
                                                        </> : <>
                                                            {isUserMessage ?
                                                                <>
                                                                    <p className={isLastMessage ? "myLastMessage" : "myMessage"}>{messageX.message}</p>
                                                                </> : <>
                                                                    <p className={isLastMessage ? "lastMessage" : "message"}>{messageX.message}</p>
                                                                </>
                                                            }
                                                        </>

                                                    }
                                                </div>
                                            )
                                        })
                                    )
                                    : <Loading />}
                                </ol >
                            </div>
                            <form className="nuevoMensaje" onSubmit={handleSendMessage}>
                                <input id="nombre" name="nombre" type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className='input inputChat' />
                                <button className="sendMsgBtn" type="submit" >
                                    <img alt="Enviar Mensaje" className="sendMsgImg" src={design["next"].url} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div > : <Loading />
            }
        </>)
    }
}