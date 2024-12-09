import React, { useEffect, useState } from 'react';
import '../css/nav.css';
import { Link } from 'react-router-dom';
import { getAllDesignPhotos } from '../firebase/firebaseStorage';


function Header() {
    const [design, setDesign] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const fotos = await getAllDesignPhotos()
            setDesign(fotos);
        }
        fetchUserData();
    }, []);
    if (design) {
        return (
            <>
                <div className='header caveat'>
                    <div className='logoHeader'>
                        <img className='headerImg' alt='logo Chic-kss' src={design["logoChic"].url} />

                    </div>
                    <div>
                        <Link to="/inbox">
                            <img alt='inbox' src={design["navInbox"].url} className='headerImgInbox boton' />
                        </Link>
                    </div>
                </div>
            </>
        );
    }
}

export default Header;