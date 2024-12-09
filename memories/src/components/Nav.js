import { Link } from 'react-router-dom';

import { getAllDesignPhotos } from '../firebase/firebaseStorage.js';

import '../css/nav.css';
import { useEffect, useState } from 'react';

export default function Nav() {
    const [design, setDesign] = useState(null);
    
    useEffect(() => {
        const fetchUserData = async () => {
            const fotos = await getAllDesignPhotos();
            setDesign(fotos);
        }

        fetchUserData();
    }, []);

    if (design) {
        return (
            <div className="nav">
                <div className="imgContNav"><Link to="/profile"><img className="img boton" alt="profile" src={design["navProfile"].url}></img></Link></div>
                <div className="imgContNav"><Link to="/home"><img className="img boton" alt="profile" src={design["logoMemories"].url}></img></Link></div>
                <div className="imgContNav"><Link to="/settings"><img className="img boton" alt="profile" src={design["navSettings"].url}></img></Link></div>
            </div>
        )
    }

    return   <div className="nav"> </div>
}