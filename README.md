# 🌱 touchgrass
### Run. Explore. Earn Datacoins.

**touchgrass** is a gamified running app that turns real-world movement into a new form of *data mining*.  
Built for ETHGlobal, it uses **Yellow Network state channels**, **Reclaim Protocol zkTLS proofs**, and **Lighthouse Datacoins** to reward users for verified, privacy-preserving real-world data contributions.

---

## 🚀 What It Does

When users go for a run and hit **START**, touchgrass opens a **state channel** via **Yellow Network (Nitrolite)** between their wallet and the backend server.  
As they move, their GPS coordinates stream off-chain in real time, allowing instant location updates and gameplay interactions with no gas fees.

While running, users can complete **data quests** — e.g., spotting potholes, EV chargers, or water fountains.  
Each quest generates:
1. a **zkTLS proof** (via [Reclaim Protocol](https://reclaimprotocol.org)) verifying time & location without revealing sensitive data,  
2. an **LLM-based validation** step to check the photo content,  
3. and a **Datacoin mint** using the [Lighthouse SDK](https://lighthouse.storage).

When the runner presses **STOP**, the **Yellow state channel** settles on-chain — finalizing captures, verifying proofs, and distributing Datacoins to the user’s wallet.  

All mined Datacoins are stored through **Lighthouse** and published to **1MB.io** as consumer data assets.

---

## 🧠 Why We Built This

We wanted to make *touching grass* productive — to turn outdoor activity into a decentralized data collection network.  
Instead of mining blocks, users **mine reality** — contributing verifiable, privacy-preserving data that can power open maps, smart cities, and environmental analytics.

---

## 🏗️ How It’s Made

- **Next.js** — Web app frontend and dashboard  
- **Mapbox GL JS** — Live map of runners, datacoins, and territories  
- **Yellow SDK + Nitrolite Protocol** — Session-based off-chain transactions and on-chain settlement  
- **Reclaim Protocol (zkTLS)** — Privacy-preserving proofs of time and location  
- **Lighthouse SDK** — Datacoin minting and decentralized storage  
- **MongoDB** — Run, user, and datacoin persistence  
- **LLM Validator (Python microservice)** — Content validation for data submissions  

Architecture:
