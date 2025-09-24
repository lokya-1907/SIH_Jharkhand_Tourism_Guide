# Jharkhand Tourism Guide 🌿

A visually engaging web application built using **React** and **Tailwind CSS** to promote tourism across the beautiful districts of **Jharkhand**. Users can explore districts, attractions, maps, and get useful travel helpline info.

## 🚀 Features

- 🗺️ Browse all districts with key details
- 📍 Explore tourist attractions by type and location
- 🖼️ Rich visuals with responsive design
- 🧭 Google Maps integration
- 🆘 Travel helplines for emergencies
- 🌐 Fast and mobile-friendly experience

## 🛠️ Built With

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- React Router
- JSON-based dynamic content

## 📂 Folder Structure

src/ ├── components/ // Header, Footer, etc. ├── data/ // districts.json, places.json ├── pages/ // Home, Districts, DistrictDetail, etc. ├── App.jsx └── main.jsx

perl
Copy
Edit

## 🚧 Run Locally

```bash
npm install
npm run dev
# open http://localhost:5173
```

## 🔧 Environment

Create a `.env` file in the project root (Vite style) and add keys as needed:

```
VITE_GEMINI_API_KEY=your_gemini_key
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_RAZORPAY_KEY_ID=your_razorpay_key
VITE_TRANSLATE_API_URL=https://your-translate-api
VITE_TRANSLATE_API_KEY=your-translate-key
VITE_ECO_API_URL=https://your-eco-api/scores
VITE_SAFETY_API_URL=https://your-safety-api/alerts
VITE_NFT_CONTRACT=0xYourPolygonAmoyContract
VITE_NFT_ABI=[{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"string","name":"uri","type":"string"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"}]
```

If env vars are not set, the app gracefully falls back to sample data and stub flows for demos.

Made with ❤️ for Jharkhand.
