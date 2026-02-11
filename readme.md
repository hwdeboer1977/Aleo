# 📘 Aleo Monorepo

This repository contains a collection of Aleo programs and zero-knowledge proof experiments.  
It centralises multiple subprojects developed during my research, prototyping, and protocol design work on the Aleo network.

## 📂 Projects

### **Aleo_ARC4626_vault/**
An Aleo implementation inspired by the ERC-4626 tokenized vault standard.  
Used for experimenting with private yield-bearing vaults, deposit/withdraw flows, and future privacy-preserving DeFi primitives.

### **Proof_Of_Care/**
A zero-knowledge proof prototype demonstrating private eligibility proofs and privacy-preserving verification flows.  
Part of a broader exploration into social impact and identity applications on Aleo.

### **aleo-leo-wallet/**
A minimal React + TypeScript frontend demonstrating Leo Wallet integration on Aleo.  
Features network selection (Mainnet/Testnet), connect/disconnect flow, and serves as a starting point for building Aleo dApps. Includes documentation on early-stage tooling quirks and workarounds.

### **aleo-multisig/**
A working deployment and test of the [AleoNet Aleo Modular Multisig System](https://github.com/AleoNet/aleo-multisig).  
Includes a complete setup guide covering local devnet deployment, wallet creation, the 3-phase signing flow (init → sign → execute), fund transfers, and admin operations (threshold changes, adding/removing signers). Supports both Aleo and ECDSA (Ethereum) signers with configurable M-of-N thresholds.

### **aleo-shield-wallet/**
Shield wallet integration and experimentation for Aleo.

## 🎯 Purpose
The goal of this monorepo is to provide:
- A clean, public overview of my Aleo development work  
- A central place for experiments, prototypes, and reusable building blocks  
- A foundation for future Aleo-based DeFi, identity, and ZK research projects  

## 🛠 Tech Stack
- **Aleo / Leo**  
- **Zero-knowledge circuits**  
- **Private state transitions**  
- **React / TypeScript** (for frontend integrations)
- **CLI tools & scripts**

## 📄 License
MIT
