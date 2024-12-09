import React from 'react';
import ReactDOM from 'react-dom/client';
import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

import { HomeView } from './routes/HomeView.js';
import { ProfileView } from './routes/ProfileView.js';
import { SettingsView } from './routes/SettingsView.js';
import { InboxView } from './routes/InboxView.js';
import { PublicProfileView } from './routes/PublicProfileView.js';
import EventView from './routes/EventView.js';

import { RegisterView } from './components/RegisterView.js';
import { ProtectRoute } from './components/ProtectRoute.js';
import OpeningComponent from './components/Opening.js';
import {ChatRoom} from './components/Chat/ChatRoom.js';
import App from './components/App.js';

import './css/general.css';


const root = ReactDOM.createRoot(document.getElementById('root'));
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={< App />}>
      <Route path="/" element={<OpeningComponent />} />
      <Route path="/register" element={<RegisterView />} />
      <Route path="/" element={<ProtectRoute />}>
        <Route path="/home" element={<HomeView />} />
        <Route path="/profile" element={<ProfileView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/inbox" element={<InboxView />} />
        <Route path="/:event" element={<EventView />} />
        <Route path="/profile/:encryptedUid" element={<PublicProfileView />} />
        <Route path="/chats/:encryptedChatUid" element={<ChatRoom />} />
      </Route>
    </Route>
  )
)

root.render(
  <RouterProvider router={router} />
);

