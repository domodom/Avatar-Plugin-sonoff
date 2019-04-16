    let cyto, module_data, sentence, debug, data_request, data_module, data_room, data_enabled;


    const {
      Graph
    } = require('cyto-avatar');
    const {
      remote
    } = require('electron');
    const {
      Menu,
      BrowserWindow
    } = remote;
    const fs = require('fs-extra');

    let cmd, tts;

    const cmd_on = "cmnd=Power%20On";
    const cmd_off = "cmnd=Power%20off";

    const ttsOn = " est allumé.";
    const ttsOff = " est éteint.";
    const nodeType = "sonoff";

    exports.init = function() {
      Avatar.listen('sonoff', function(data) {

        let client = data.client;
        let config = Config.modules.sonoff;
        let devices = Config.modules.sonoff.devices;

        if (devices.hasOwnProperty(data.room)) {
          if (devices[data.room][data.module]) {
            let module_data = {
              name: data.module,
              room: data.room,
              user: devices[data.room][data.module].user,
              password: devices[data.room][data.module].password,
              ip: devices[data.room][data.module].ip,
              icone: devices[data.room][data.module].icone,
              set: data.set
            };
            get_module(module_data, client);
          } else {
            Avatar.speak('Je n\'ai pas trouvé le module ' + data.module + ' dans la pièce ' + data.room, client, function() {
              Avatar.Speech.end(client);
            });
          }
        } else {
          Avatar.speak('Je n\'ai pas trouvé le module ' + data.module + ' dans la pièce ' + data.room, client, function() {
            Avatar.Speech.end(client);
          });
        }
      });
    }

    exports.addPluginElements = function(CY) {
      if (Config.modules.sonoff.node.displayNode) {
        cyto = new Graph(CY, __dirname);
        cyto.loadAllGraphElements()
          .then(elems => {
            elems.forEach(function(ele) {
              if (ele.hasClass(nodeType)) {
                cyto.onClick(ele, (evt) => {
                    showContextMenu(evt, module_data);
                  })
                  .then(elem => cyto.onRightClick(elem, (evt) => {
                    showContextMenu(evt, module_data);
                  }))
              }
            })
          })
          .catch(err => {
            warn('Error loading Elements', err);
          })
      } else {
        info('SonOff v', Config.modules.sonoff.version, 'Les modules ne sont pas visibles, vous pouvez mettre le paramètre displayNode dans le fichier de config sur (true) pour les affichés.')
      }
    }

    // Sauvegarde les modules (nodes) à la fermeture du serveur
    exports.onAvatarClose = function(callback) {
      cyto.saveAllGraphElements(nodeType)
        .then(() => {
          callback();
        })
        .catch(err => {
          if (debug) warn('Error saving Elements', err)
          callback();
        })
    }

    exports.action = function(data, callback) {
      sentence = data.action.sentence;
      data_module = data.action.req_module;
      data_room = data.action.req_room;
      data_enabled = data.action.req_enabled;
      debug = Config.modules.sonoff.debug;

      let client = data.client;
      config = Config.modules.sonoff;
      let devices = Config.modules.sonoff.devices;

      if (!data_room) data_room = data.client.toLowerCase();

      var tblCommand = {

        turn_on: function() {
          if (devices.hasOwnProperty(data_room)) {
            if (devices[data_room][data_module]) {
              let module_data = {
                name: data_module,
                room: data_room,
                user: devices[data_room][data_module].user,
                password: devices[data_room][data_module].password,
                ip: devices[data_room][data_module].ip,
                icone: devices[data_room][data_module].icone,
                set: true
              };
              get_module(module_data, client);
            } else {
              Avatar.speak('Je n\'ai pas trouvé le module ' + data_module + ' dans la pièce ' + data_room, client, function() {
                Avatar.Speech.end(client);
              });
            }
          } else {
            Avatar.speak('Je n\'ai pas trouvé le module ' + data_module + ' dans la pièce ' + data_room, client, function() {
              Avatar.Speech.end(client);
            });
          }
        },

        turn_off: function() {
          if (devices.hasOwnProperty(data_room)) {
            if (devices[data_room][data_module]) {
              let module_data = {
                name: data_module,
                room: data_room,
                user: devices[data_room][data_module].user,
                password: devices[data_room][data_module].password,
                ip: devices[data_room][data_module].ip,
                icone: devices[data_room][data_module].icone,
                set: false
              };
              get_module(module_data, client);
            } else {
              Avatar.speak('Je n\'ai pas trouvé le module ' + data_module + ' dans la pièce ' + data_room, client, function() {
                Avatar.Speech.end(client);
              });
            }
          } else {
            Avatar.speak('Je n\'ai pas trouvé le module ' + data_module + ' dans la pièce ' + data_room, client, function() {
              Avatar.Speech.end(client);
            });
          }
        }
      };

      info("SONOFF v", config.version, " - Command: ", data.action.command, " From: ", data.client, " To: ", client);
      tblCommand[data.action.command]();

      callback();
    }

    var get_module = function(module_data, client) {
      if (module_data.set) {
        cmd = cmd_on;
        tts = ttsOn;
      } else {
        cmd = cmd_off;
        tts = ttsOff;
      }

      var http = require('http');
      var options = {
        hostname: module_data.ip,
        port: 80,
        path: '/cm?&user=' + module_data.user + '&password=' + module_data.password + '&' + cmd
      };

      http.get(options, function(res) {
        var buffer = '';
        res.on('data', function(chunk) {
          buffer += chunk;
        });

        res.on('end', function() {
          Avatar.speak(module_data.name + ' dans la pièce ' + module_data.room + tts, client, function() {
            Avatar.Speech.end(client);
            setTimeout((function() {
              addSonoffGraph(module_data);
            }), 500);
          });
        });
      }).on('error', function(e) {
        Avatar.speak('Une erreur s\'est produite !', client, function() {
          Avatar.Speech.end(client);
        });
      });

    }

    function addSonoffGraph(module_data) {
      let style = {};
      let id;

      id = module_data.name.toLowerCase() + '_' + module_data.room.toLowerCase();

      style.x = 150;
      style.y = 150;
      style.img = '';

      cyto.removeGraphElementByID(id);

      if ((Config.modules.sonoff.node.delNodeAfterCommand) && (module_data.set == false)) {
        return;
      } else {
        if (fs.existsSync('./resources/core/plugins/sonoff/modules.json')) {
          let prop = fs.readJsonSync('./resources/core/plugins/sonoff/modules.json', {
            throws: false
          });
          if (prop[id]) {
            style.x = prop[id].x;
            style.y = prop[id].y;
          }
        }

        if (fs.existsSync('./resources/core/plugins/sonoff/assets/nodes/' + module_data.name + '.json')) {
          let prop = fs.readJsonSync('./resources/core/plugins/sonoff/assets/nodes/' + module_data.name + '.json', {
            throws: false
          });
          if (prop) {
            style.x = prop.position.x;
            style.y = prop.position.y;
          }
        }

        return new Promise((resolve, reject) => {
          cyto.getGraph()
            .then(cy => cyto.addGraphElement(cy, id))
            .then(elem => cyto.addElementName(elem, id))
            .then(elem => cyto.addElementClass(elem, nodeType))
            .then(elem => cyto.addElementImage(elem, __dirname + '/assets/images/modules/' + module_data.icone + '.png'))
            .then(elem => cyto.addElementSize(elem, 45))
            .then(elem => cyto.selectElement(elem, false))
            .then(elem => cyto.addElementRenderedPosition(elem, style.x, style.y))
            .then(elem => cyto.onClick(elem, (evt) => {
              // cyto.selectElement(evt, !cyto.isElementSelected(evt))
              showContextMenu(evt, module_data);
            }))

            .then(elem => {
              resolve(elem);
            })
            .catch(err => {
              reject();
            })
        })
      }
    }


    // lors de l'action sur un node, test la valeur de muteOnOffClient
    function mute_Client(client) {
      let muteClient = fs.readJsonSync('./resources/core/muteClient.json', 'utf-8', (err) => {
        if (err) throw err;
        if (debug) info('Le fichier n\'existe pas');
      });
      // Avatar.Speech.end(client);
      if (muteClient[client] == true) {
        if (debug) info(client, ' est sur true.');
        setTimeout(function() {
          Avatar.call('generic', {
            command: 'muteOnOffClient',
            set: '0',
            client: client
          });
        }, 10000);
      } else {
        if (debug) info(client, ' est sur false.');
      }
    }

    // menu contextuel pour les modules
    function showContextMenu(elem, module_data) {

      let id = elem.id();

      data_room = id.substring(id.lastIndexOf("_"));
      data_room = data_room.replace('_', '');
      data_module = id.slice(0, id.indexOf("_"));

      let pluginMenu = [{
          label: 'Allumer / Ouvrir',
          icon: 'resources/app/images/icons/activate.png',
          click: () => {
            module_data = {
              name: data_module,
              room: data_room,
              user: Config.modules.sonoff.devices[data_room][data_module].user,
              password: Config.modules.sonoff.devices[data_room][data_module].password,
              ip: Config.modules.sonoff.devices[data_room][data_module].ip,
              icone: Config.modules.sonoff.devices[data_room][data_module].icone,
              set: true
            };
            get_module(module_data, Config.default.client);
            mute_Client(Config.default.client);
          }
        },
        {
          label: 'Eteindre / Fermer',
          icon: 'resources/app/images/icons/desactivate.png',
          click: () => {
            module_data = {
              name: data_module,
              room: data_room,
              user: Config.modules.sonoff.devices[data_room][data_module].user,
              password: Config.modules.sonoff.devices[data_room][data_module].password,
              ip: Config.modules.sonoff.devices[data_room][data_module].ip,
              icone: Config.modules.sonoff.devices[data_room][data_module].icone,
              set: false
            };
            get_module(module_data, Config.default.client);
            mute_Client(Config.default.client);
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Sauvegarder',
          icon: 'resources/app/images/icons/save.png',
          click: () => {
            Avatar.Interface.onAvatarClose(0, function() {
              let module_data = {
                "name": data_module,
                "room": data_room
              };
              saveModuleNode(module_data, elem);
              if (debug) info(elem.id() + ' sauvegardé !');
            })
          }
        },
        {
          label: 'Effacer',
          icon: 'resources/app/images/icons/trash.png',
          click: () => {
            cyto.removeGraphElementByID(elem.id());
            if (debug) info(elem.id() + ' à été éffacé !');
          }
        }
      ];

      // Création du menu
      var handler = function(e) {
        e.preventDefault();
        menu.popup({
          window: remote.getCurrentWindow()
        });
        window.removeEventListener('contextmenu', handler, false);
      }
      const menu = Menu.buildFromTemplate(pluginMenu);
      window.addEventListener('contextmenu', handler, false);
    }

    // Sauvegarde les infos des modules dans le fichier modules.json
    // Cette fonction est appelée lorsque vous enregistrez individuellement les modules (clic droit).
    // Enregistre l'emplacement du module, utilsée pour réafficher à l'emplacement enregistré !

    function saveModuleNode(module_data, elem) {
      let id = elem.id();

      let moduleJSON = fs.readJsonSync('./resources/core/plugins/sonoff/modules.json', 'utf-8', (err) => {
        if (err) throw err;
        info('Le fichier modules.json n\'existe pas');
      });

      moduleJSON[id] = {};
      moduleJSON[id].name = module_data.name;
      moduleJSON[id].room = module_data.room;
      moduleJSON[id].icone = module_data.icone;
      moduleJSON[id].x = elem.renderedPosition('x');
      moduleJSON[id].y = elem.renderedPosition('y');

      fs.writeFileSync('./resources/core/plugins/sonoff/modules.json', JSON.stringify(moduleJSON, null, 4), 'utf8');

    }
