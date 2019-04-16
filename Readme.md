![](https://raw.githubusercontent.com/Spikharpax/Avatar-Serveur/master/logo/Avatar.jpg)
![](https://i1.wp.com/nalaweb.com/wp-content/uploads/2018/07/switch-sonoff-basic-wish.jpg?fit=620%2C504&ssl=1)

**Fonctions :**

-   Allume / Ouvre / Eteint / Ferme + ( module + pièce ).

**EX :**

- Allume la lumière du salon
- Eteint le chevet de la chambre.
- Eteint le chevet. (Eteint le chevet de la pièce ou vous vous situez)

**Configuration :**

Dans le fichier fibaro.prop

      "devices": {
        "bureau": {
          "chevet": {
            "user": "admin",
            "password": "",
            "ip": "192.168.x.x",
            "icone": "chevet"
          }
        },
        "chambre": {
          "chevet": {
            "user": "admin",
            "password": "password",
            "ip": "192.168.x.x",
            "icone": "chevet"
          },
		   "lumière": {
            "user": "admin",
            "password": "password",
            "ip": "192.168.x.x",
            "icone": "pc"
          }
        }
      },
	
	  "node":{
	  "displayNode":true ou false 			(Permet d'afficher une icône sur l'interface du serveur)
	  "delNodeAfterCommand":true ou false   (Efface l'icone de l'interface du serveur après une commande de fermeture)
	},	
		
**Versions :**

Version 1.3 (10-04-2019)

- [x] Selon paramètre ajout d'un node par module sur l'interface serveur.
- [x] Selon paramètre lors de la fermeture supprime le node (module)
- [x] Chaque module affiché à un menu contextuel pour commander l'appareil.

Version 1.0 (24-09-2018)

- [x] Allumer / Eteindre un module 
- [x] Demander le statut d'un module

