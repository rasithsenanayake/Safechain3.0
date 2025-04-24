import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// Add Font Awesome to the project
const linkElement = document.createElement('link');
linkElement.rel = 'stylesheet';
linkElement.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
document.head.appendChild(linkElement);

// Update document title
document.title = 'SafeChain | Secure Storage';

// Add favicon if not already present
if (!document.querySelector("link[rel='icon']")) {
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.href = 'Safechain.png';
  document.head.appendChild(favicon);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
