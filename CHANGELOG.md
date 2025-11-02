# 🧭 OneBoarding AI — Changelog Officiel

---

## Version 1.0 — 01 Novembre 2025  
### **Implémentation Benmehdi Protocol – Flux /api/pay/return**

**Nature de la version :**  
Version fondatrice du flux d’activation et de liaison **PayPal ↔ Espace utilisateur ↔ Session souveraine.**  
Cette version consacre la jonction juridique entre **identité**, **consentement**, et **possession matérielle** (device), selon la philosophie du **Benmehdi Protocol**.

---

### ⚙️ **Éléments structurants**

- Création automatique de l’espace utilisateur à partir du paiement validé.  
- Association immédiate du device fondateur :  
  `authorized = true`, `firstAuthorizedAt = now()`.  
- Enregistrement du consentement **uniquement** si celui-ci a été manifesté **antérieurement** via le bouton **« Lu et approuvé »**.  
- Génération et dépôt automatique de la **session souveraine** (`ob_session`, TTL = 30 jours).  
- Respect absolu du principe d’**immutabilité du consentement** (`consentAt` jamais réécrit).  
- Conformité intégrale au **Benmehdi Protocol** :  
  - Identité = numéro de téléphone  
  - Preuve matérielle = device autorisé  
  - Continuité juridique = session horodatée

---

### 🧩 **Environnement technique**

- **Déploiement :** Production — *Vercel* (`main@484ee43`)  
- **Stack :** Next.js 14.2.5 · Prisma 5.18.0  
- **Base :** PostgreSQL (*NeonTech – EU Central*)  
- **Client DB :** `@/lib/db.ts` (export unique : `prisma`)  
- **Dépendances :** Aucune additionnelle — suppression de `date-fns`,  
  remplacée par fonction interne `addDays()`.

---

### ⚖️ **Fondement juridique et doctrinal**

- Le **consentement** n’est jamais déduit ni implicite :  
  il est **manifesté, daté et enregistré** exclusivement via le clic  
  sur le bouton *« Lu et approuvé »* en bas de la page **/legal**.  
- La **page /protocol** est publique, antérieure et universelle.  
  Elle n’exige pas d’approbation ; elle **formalise la doctrine fondatrice**.  
- Le **clic d’approbation** ne crée pas le contrat :  
  il **formalise la preuve** de l’accord préexistant, déjà né par usage volontaire.  

---

### 🪪 **Signature de version**

**Maître Benmehdi Mohamed Rida**  
Avocat au Barreau de Casablanca · Docteur en Droit  
Fondateur du **Benmehdi Protocol** & de **OneBoarding AI**

*(v 1.0 — 01 novembre 2025 · Implémentation fondatrice stable)*

---
