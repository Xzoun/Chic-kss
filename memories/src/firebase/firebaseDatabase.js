import { ref, set, get, remove, child, update, onChildAdded, onValue, push } from "firebase/database";
import { database } from "./firebaseConfig";

/*------------------------------------CRUD User */
export async function createUser(uid, user) {
    try {
        await set(ref(database, 'users/' + uid), {
            uid: user.uid,
            access: user.access,
            displayName: user.displayName,
            photoURL: user.photoURL,
            eventos: user.eventos,
            redes: { whatsapp: "", facebook: "", instagram: "", x: "", tiktok: "", linkedin: "" }
        });
    } catch (error) {
        console.log(error);
    }
}

export async function readUser(uid) {
    const userPathRef = ref(database, 'users/' + uid);

    try {
        const snapshot = await get(userPathRef);
        const data = snapshot.val();
        return data;
    } catch (error) {
        console.error("Error reading user:", error);
        return null;
    }

}

export function listenToUser(callback, uid) {
    const eventsRef = ref(database, `users/${uid}`);

    try {
        onValue(eventsRef, (snapshot) => {
            callback(snapshot.exists());
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

export async function updateUser(updatedUser) {
    const userRef = ref(database, 'users/' + updatedUser.uid);

    try {
        await update(userRef, updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
    }
}

export async function userExists(uid) {
    const userPathRef = ref(database, 'users/' + uid);

    try {
        const snapshot = await get(userPathRef);
        return snapshot.exists();
    } catch (error) {
        console.error("Error reading user:", error);
        return false;
    }
}

export function deleteUser(id) {
    const dbRef = ref(database);
    remove(child(dbRef, id));
}

/*------------------------------------CRUD Event */

export function listenToEvents(callback) {
    const eventsRef = ref(database, 'events');

    try {
        onChildAdded(eventsRef, () => {
            callback(true);
        });
    } catch (error) {
        console.error('Error fetching chat list:', error);
        throw error;
    }
}

export async function createEvent(event) {
    const guests = Array.isArray(event.guests) ? event.guests : [];
    try {
        await set(ref(database, 'events/' + event.uid), {
            uid: event.uid,
            name: event.name,
            inicio: event.inicio,
            fin: event.fin,
            guests: guests
        });
    } catch (error) {
        console.error("Error al crear el álbum:", error);
    }
}

export async function readEvent(uid) {
    const userPathRef = ref(database, 'events/' + uid);

    try {
        const snapshot = await get(userPathRef);
        const data = snapshot.val();
        return data;
    } catch (error) {
        console.error("Error reading Event:", error);
        return null;
    }
}

export async function guestExists(event, uid) {
    let exists = false;

    if (event.guests) {
        for (let i = 0; i < event.guests.length; i++) {

            if (uid === event.guests[i]) {
                exists = true;
                i = event.guests.length
            }
        }
    }

    return exists;
}

export async function updateEvent(updates) {
    const eventRef = ref(database, `events/${updates.uid}`);

    try {
        await update(eventRef, updates);
    } catch (error) {
        console.error('Error al actualizar el evento:', error);
    }
}

export async function eventExists(event) {
    const userPathRef = ref(database, 'events/' + event);

    try {
        const snapshot = await get(userPathRef);
        return snapshot.exists();
    } catch (error) {
        console.error("Error reading user:", error);
        return false;
    }
}
/*------------------------------------CRUD Event --> Foto */

export async function createPhoto(event, user) {
    try {
        const eventData = await readEvent(event);

        const fotos = Array.isArray(eventData.fotos) ? eventData.fotos : [];

        const ahora = new Date();
        const codigoUnico = ahora.getTime();

        fotos.push({
            uid: codigoUnico,
            eventUid: event,
            likes: [user],
            codigoUsuario: user,
        });

        eventData.fotos = fotos;
        await updateEvent(eventData);

        return (codigoUnico);
    } catch (error) {
        console.error("Error al agregar la foto al evento:", error);
    }
}

export function listenToEvent(callback, uid) {
    const eventsRef = ref(database, `events/${uid}`);

    try {

        onValue(eventsRef, (snapshot) => {
            callback(snapshot.val());
        });
    } catch (error) {
        console.error('Error fetching event photos:', error);
        throw error;
    }
}

export async function updatePhoto(event, updatedPhoto, indexFoto) {
    try {
        const eventData = await readEvent(event);

        let fotos = Array.isArray(eventData.fotos) ? [...eventData.fotos] : [];

        if (indexFoto >= 0 && indexFoto < fotos.length) {
            fotos[indexFoto] = updatedPhoto;
        }

        eventData.fotos = fotos;
        await updateEvent(eventData);
    } catch (error) {
        console.error("Error al actualizar la foto en el evento:", error);
    }
}

export async function deletePhoto(eventUid, photoUid) {
    try {
        const eventRef = ref(database, 'events/' + eventUid);
        const snapshot = await get(eventRef);
        if (!snapshot.exists()) {
            console.error("No existe el evento con UID:", eventUid);
            return;
        }

        const eventData = snapshot.val();

        if (Array.isArray(eventData.fotos)) {
            eventData.fotos = eventData.fotos.filter(foto => foto.uid !== photoUid);
        } else {
            return;
        }

        await update(ref(database, 'events/' + eventUid), {
            fotos: eventData.fotos
        });

        return true;
    } catch (error) {
        console.error("Error al eliminar la foto:", error);
        return false;
    }
}

export async function createPortada(event, user) {
    try {
        const eventData = await readEvent(event);

        const fotos = Array.isArray(eventData.fotos) ? eventData.fotos : [];

        const ahora = new Date();
        const codigoUnico = ahora.getTime();

        const portada = {
            uid: "portada",
            eventUid: event,
            likes: [user],
            codigoUsuario: user,
        };

        fotos[0] = portada;
        eventData.fotos = fotos;

        await updateEvent(eventData);

        return codigoUnico;
    } catch (error) {
        console.error("Error al agregar la foto de portada al evento:", error);
    }
}

export async function getPhotoLikes(event, photoUid) {
    try {
        const eventData = await readEvent(event);

        const fotos = Array.isArray(eventData.fotos) ? eventData.fotos : [];

        const foto = fotos.find(foto => foto.uid === photoUid);

        if (foto) {

            return foto.likes;
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error al obtener los likes de la foto:", error);
        return [];
    }
}

export async function getPhotoReports(event, photoUid) {
    try {
        const eventData = await readEvent(event);

        const fotos = Array.isArray(eventData.fotos) ? eventData.fotos : [];

        const foto = fotos.find(foto => foto.uid === photoUid);

        if (foto) {

            return foto.reports;
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error al obtener los likes de la foto:", error);
        return [];
    }
}

export async function readPhotographer(eventUid, photoIndex) {
    try {
        const eventRef = ref(database, 'events/' + eventUid);
        const snapshot = await get(eventRef);

        if (snapshot.exists()) {

            const fotos = snapshot.val().fotos;

            if (Array.isArray(fotos) && fotos.length > photoIndex) {

                const codigoUsuario = fotos[photoIndex].codigoUsuario;
                return codigoUsuario;
            } else {
                return null;
            }
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error al leer el fotógrafo:', error);
        return null;
    }
}

/*------------------------------------CRUD Inbox */

export async function createChat(chat) {
    try {
        const chatRef = ref(database, 'chats');
        const newChatRef = push(chatRef);

        await set(newChatRef, {
            uid: newChatRef.key,
            user: chat.user,
            user2: chat.user2,
            fin: chat.fin,
            messages: [{
                sender: "Chic-kss",
                id: 0,
                message: 'Recuerda ser respetuoso y que todos los chats se auto-eliminarán pasadas 48 horas de la finalización del evento.',
                hora: Date.now()
            }]
        });

        return newChatRef.key;
    } catch (error) {
        console.error('Error al crear el chat:', error);
        throw error;
    }
}

export async function chatExists(user1, user2) {
    try {
        const chatRef = ref(database, 'chats');
        const snapshot = await get(chatRef);

        if (snapshot.exists()) {
            const chats = snapshot.val();

            const existingChat = Object.values(chats).find(chat =>
                (chat.user === user1 && chat.user2 === user2) || (chat.user === user2 && chat.user2 === user1)
            );

            return !!existingChat;
        }

        return false;
    } catch (error) {
        console.error('Error al verificar si el chat existe:', error);
        throw error;
    }
}

export async function getChatUid(user1, user2) {
    try {
        const chatRef = ref(database, 'chats');
        const snapshot = await get(chatRef);

        if (snapshot.exists()) {
            const chats = snapshot.val();

            const existingChat = Object.entries(chats).find(([key, chat]) =>
                (chat.user === user1 && chat.user2 === user2) || (chat.user === user2 && chat.user2 === user1)
            );

            if (existingChat) {
                return existingChat[0];
            }
        }

        return null;
    } catch (error) {
        console.error('Error al verificar si el chat existe:', error);
        throw error;
    }
}

export async function loadChatMessages(chatCode) {
    const chatsRef = ref(database, 'chats');

    try {
        const snapshot = await get(chatsRef);

        if (snapshot.exists()) {
            const chats = snapshot.val();

            for (const chatId in chats) {
                const chat = chats[chatId];
                if (chat.uid === chatCode) {
                    return chat.messages;
                }
            }
        }

        return [];

    } catch (error) {
        console.error('Error fetching chat list:', error);
        throw error;
    }
}

export async function loadChat(chatUid) {
    const chatRef = ref(database, `chats/${chatUid}`);

    try {
        const snapshot = await get(chatRef);

        if (snapshot.exists()) {
            return snapshot.val();
        }

        return null;

    } catch (error) {
        console.error('Error al cargar el chat:', error);
        throw error;
    }
}

export async function createMessage(messageContent, chatId, sender) {
    try {
        const messagesRef = ref(database, `chats/${chatId}/messages`);

        const newMessage = {
            sender: sender,
            id: Date.now(),
            message: messageContent,
            hora: Date.now(),
        };

        await update(messagesRef, {
            [Date.now()]: newMessage
        });

    } catch (error) {
        console.error('Error creating message:', error);
        throw error;
    }
}

export async function listenForNewMessages(callback, chatCode) {
    const chatsRef = ref(database, 'chats');

    try {
        const snapshot = await get(chatsRef);

        if (snapshot.exists()) {
            const chats = snapshot.val();

            for (const chatId in chats) {
                const chat = chats[chatId];

                if (chat.uid === chatCode) {
                    const messagesRef = ref(database, `chats/${chatId}/messages`);

                    onChildAdded(messagesRef, () => {
                        callback(true, snapshot.val());
                    });

                }
            }
        }
    } catch (error) {
        console.error('Error fetching chat list:', error);
        throw error;
    }
}