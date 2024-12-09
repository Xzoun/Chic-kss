import { useEffect, useState } from 'react';

import { useUser } from '../context/UserContext.js';
import { readUser } from '../firebase/firebaseDatabase.js';

import { Loading } from '../components/Loading.js';
import { CrearEvento } from '../components/Home/CrearEvento.js';
import { EventsList } from '../components/Home/EventsList.js';
import { MyEvents } from '../components/Home/MyEvents.js';
import { ReportsList } from '../components/Home/ReportList.js';

export function HomeView() {
    const { uid } = useUser();
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
  

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await readUser(uid);
                setUserData(data);
                setIsLoading(false);
            } catch (error) {
                console.log('Error al obtener los datos:', error);
                setIsLoading(false);
            }
        };

        if (uid) {
            fetchData();
        }
    }, [uid]);
    
    return (

        <>
            {isLoading ? (
                <>
                    <Loading />
                </>
            ) : (
                <div className='back'>
                    <div className="home layout">
                        {userData && userData.access === "admin" ? (
                            <div className="admin">
                                <CrearEvento />
                                <EventsList />
                                <ReportsList />
                            </div>
                        ) : (
                            <div className="home layout">
                                <MyEvents />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}