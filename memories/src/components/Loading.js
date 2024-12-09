
import React from 'react';
import '../css/loading.css';

export function Loading() {
    return (
        <>
            <div className='loadingFlex'>
                <div className='loader'></div>
                <h3>Loading...</h3>
            </div>
        </>
    );
} 
