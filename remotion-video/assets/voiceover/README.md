# 🎙️ Voix-off pour SmartQueue

Ce dossier contient les fichiers audio de voix-off générés avec ElevenLabs.

## 📁 Fichiers requis

Placez les fichiers MP3 suivants dans ce dossier :

### Prologue (Narration du problème)
- `prologue1.mp3` - File interminable au guichet (10 sec)
- `prologue2.mp3` - Les resquilleurs / corruption (12 sec)
- `prologue3.mp3` - Rendez-vous manqué (12 sec)
- `prologue4.mp3` - Transition → SmartQueue (15 sec)

### Scènes de démonstration
- `scene1.mp3` - Introduction / Logo SmartQueue (10 sec)
- `scene2.mp3` - Inscription (20 sec)
- `scene3.mp3` - Créer des services (30 sec)
- `scene4.mp3` - Créer des postes (35 sec)
- `scene5.mp3` - Ajouter le personnel (45 sec)
- `scene6.mp3` - Page publique (20 sec)
- `scene7.mp3` - Parcours client (30 sec)
- `scene8.mp3` - Parcours employé (40 sec)
- `scene9.mp3` - Conclusion + CTA (25 sec)

## 🎯 Génération avec ElevenLabs

1. Allez sur https://elevenlabs.io
2. Sélectionnez une voix française (ex: Antoine ou Charlotte)
3. Utilisez les textes fournis dans `SCRIPT_VIDEO.md` (section ElevenLabs prompts)
4. Téléchargez chaque fichier MP3 avec le nom exact ci-dessus

## ✅ Vérification

Une fois tous les fichiers placés, vous devriez avoir :
```
remotion-video/assets/voiceover/
├── README.md (ce fichier)
├── prologue1.mp3
├── prologue2.mp3
├── prologue3.mp3
├── prologue4.mp3
├── scene1.mp3
├── scene2.mp3
├── scene3.mp3
├── scene4.mp3
├── scene5.mp3
├── scene6.mp3
├── scene7.mp3
├── scene8.mp3
└── scene9.mp3
```

Les fichiers audio seront automatiquement intégrés dans chaque scène via le composant `<Audio>` de Remotion.
