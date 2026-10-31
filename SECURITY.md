# Sécurité

Vous avez trouvé une faille ? Merci de ne pas ouvrir d'issue publique : utilisez
[**Report a vulnerability**](https://github.com/Musmus05/herbarium/security/advisories/new)
(onglet *Security* du dépôt). Décrivez le scénario, l'impact et, si possible, une reproduction.

Ce que l'application garantit :

- chaque utilisateur ne lit et n'écrit que ses propres lignes (Row Level Security sur toutes les tables) ;
- CV et photos sont dans des buckets privés, limités au dossier de leur propriétaire, servis par liens signés de courte durée ;
- les chemins de fichiers enregistrés en base pointent forcément dans le dossier du propriétaire (contraintes SQL) ;
- la suppression de compte efface les fichiers côté serveur, et la base refuse de supprimer un compte tant qu'il lui reste des fichiers ;
- en-têtes `X-Frame-Options: DENY`, `Content-Security-Policy` (`frame-ancestors`, `base-uri`, `form-action`, `object-src`), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

Réglages à faire dans Supabase pour un déploiement : Site URL et Redirect URLs du domaine, SMTP personnalisé (le service intégré limite fortement les e-mails), et *Secure password change*.
