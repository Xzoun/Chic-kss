import { uploadBytes, getDownloadURL, ref, list, deleteObject } from "firebase/storage";
import { storage } from "./firebaseConfig";

export async function savePhoto(path, image) {
    const imageRef = ref(storage, path);
    uploadBytes(imageRef, image);
}

export async function deletePhoto(photoPath) {
    const storageRef = ref(storage, photoPath); 

    try {
        await deleteObject(storageRef);
        console.log(`Foto eliminada correctamente: ${photoPath}`);
    } catch (error) {
        console.error('Error al eliminar la foto desde Firebase Storage:', error);
        throw error;
    }
}

export async function getAllEvents() {
    const eventRef = ref(storage, 'events');

    try {
        const eventList = await list(eventRef);

        const eventIds = eventList.prefixes.map(prefix => {
            const parts = prefix.fullPath.split('/');
            return parseInt(parts[1]);
        });

        return eventIds;
    } catch (error) {
        console.error('Error al obtener los IDs de eventos:', error);
        throw error;
    }
}

export async function getAllPhotos(event) {
    const eventRef = ref(storage, `events/${event}/`);

    try {
        const fotosList = await list(eventRef);

        const fotosIds = fotosList.items
            .filter(item => item.name !== 'portada')
            .map(item => {
                const parts = item.fullPath.split('/');
                return parseInt(parts[2]);
            });

        return fotosIds;
    } catch (error) {
        console.error('Error al obtener los IDs de eventos:', error);
        throw error;
    }
}

export async function readURLImg(route) {
    const storageRef = ref(storage, route);
    try {
        const url = await getDownloadURL(storageRef);
        return url;
    } catch (error) {
        console.error('Error al obtener la URL de la imagen:', error);
        throw error;
    }
}

export async function getEvent(event) {
    const eventRef = ref(storage, 'events/' + event.uid);

    try {
        const photosList = await list(eventRef);

        const fullEvent = photosList.prefixes.map(prefix => {
            const parts = prefix.fullPath.split('/');
            return parseInt(parts[1]);
        });

        return fullEvent;
    } catch (error) {
        console.error('Error al obtener los IDs de eventos:', error);
        throw error;
    }
}

export async function getAllDesignPhotos() {
    const designFolderRef = ref(storage, 'design'); // Ruta a la carpeta 'design' en Storage

    try {
        const filesList = await list(designFolderRef);

        const photosObject = {};
        await Promise.all(filesList.items.map(async item => {
            const url = await getDownloadURL(ref(storage, item.fullPath));
            photosObject[item.name] = { name: item.name, url };
        }));

        return photosObject;
    } catch (error) {
        console.error('Error al obtener fotos de la carpeta diseño:', error);
        throw error;
    }
}