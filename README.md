# FOR U 🌻

A personal, local-first women's wellness journal built with HTML, CSS and vanilla JavaScript.

## Features

- Period logging, cycle calendar and approximate next-period estimates
- Daily mood check-ins, stress/energy ratings and mood history
- Daily and cycle-reflection journal entries
- Symptom check-ins
- Self-care checklist and skin/hair notes
- Water and activity tracking
- Breathing exercise
- Small educational library
- Optional PIN lock with local AES-GCM encryption
- IndexedDB storage, JSON export and restore
- PWA installation and basic offline caching
- Soft lavender responsive interface and dark theme


## Important data and notification notes

- Data is stored in IndexedDB in the browser on that device and website origin.
- Data does not sync between devices. Export a backup before changing phones, browsers or clearing site data.
- If a PIN is set, the stored app data is encrypted with AES-GCM using a key derived from the PIN. Keep the PIN safe. There is no password recovery. Losing the PIN means the encrypted data cannot be recovered.
- The PIN lock is a privacy feature, not a guarantee against a determined person with device access.
- Browser notifications require permission and browser support. This static app checks for a due reminder when the app is opened, focused or made visible. It cannot guarantee a notification at an exact time while the browser/app is fully closed. Reliable scheduled background notifications require a push service/backend or native app.
- Cycle, ovulation and fertile-window estimates are not medical advice and must not be used as contraception.
- Educational material is general information, not diagnosis or treatment.

## Privacy

Do not commit personal journal exports, real health data, PINs or backups to this repository. The repository should contain only the app source and generic assets.
