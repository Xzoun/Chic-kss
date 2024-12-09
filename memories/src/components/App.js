import { Outlet, useParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { UserProvider } from '../context/UserContext.js';
import Header from './Header.js';
import Nav from './Nav.js';

function App() {
  const { event } = useParams();
  const [state, setState] = useState(0);

  if (event) {
    localStorage.setItem('event', event);
  }
  useEffect(() => {
    const delay3 = 6000;

    const timer3 = setTimeout(() => {
      setState(1)
    }, delay3);

    return () => {
      clearTimeout(timer3);
    };
  }, []);

  return (

    <>
      <UserProvider>

        <Outlet />
        {state === 1 &&
          <>
            <Header />
            <Nav />
          </>
        }
      </UserProvider>
    </>
  );
}

export default App;
