/**
 * @name BetterServerFolders
 * @author Im_Banana#6112
 * @description Make The Server Folders Better!
 * @version 1.0.1
 * @authorId 635250116688871425
 * @website https://github.com/pronoob742/BetterServerFolders
 * @source https://github.com/pronoob742/BetterServerFolders
 * @updateUrl https://raw.githubusercontent.com/pronoob742/BetterServerFolders/main/BetterServerFolders.plugin.js
 */
/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();
@else@*/
module.exports = (() => {
    const config = {
        "info": {
            "name": "BetterServerFolders",
            "authors": [{
                "name": "Im_Banana",
                "discord_id": "635250116688871425",
                "github_username": "pronoob742"
            }],
            "version": "1.0.1",
            "description": "Make The Server Folders Better!",
            "github": "https://github.com/pronoob742/BetterServerFolders",
            "github_raw": "https://raw.githubusercontent.com/pronoob742/BetterServerFolders/main/BetterServerFolders.plugin.js"
        },
        "changelog": [
            // {
            //     "title": "New Stuff",
            //     "items": [
            //         "Added close animation!"
            //     ]
            // },
            // {
            //     "title": "Bugs Fixes",
            //     "type": "fixed",
            //     "items": [
            //         ""
            //     ]
            // },
            // {
            //     "title": "Improvements",
            //     "type": "improved",
            //     "items": [
            //         ""
            //     ]
            // },
            // {
            //     "title": "On-going",
            //     "type": "progress",
            //     "items": [
            //         ""
            //     ]
            // }
        ],
        "main": "BetterServerFolders.plugin.js"
    };

    return !global.ZeresPluginLibrary ? class {
        constructor() {
            this._config = config;
        }
        getName() {
            return config.info.name;
        }
        getAuthor() {
            return config.info.authors.map(a => a.name).join(", ");
        }
        getDescription() {
            return config.info.description;
        }
        getVersion() {
            return config.info.version;
        }
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
            const {
                Patcher,
                DiscordModules,
                DiscordAPI,
                Settings,
                Toasts,
                PluginUtilities
            } = Api;

            let elementsToRemove = []

            let customFolders = []

            let observers = []

            /**
             * @param {string} query 
             * @param {string} element
             * @param {{position: "afterbegin" | "afterend" | "beforebegin" | "beforeend", removeOnStop: Boolean}} option
             */
            function addElements(query, element, option = { position: "beforeend", removeOnStop: true }) {
                const parentElement = document.querySelector(query)
                if(parentElement) {
                    const node = parentElement.insertAdjacentElement(option.position, new DOMParser().parseFromString(element, "text/html").body.firstChild)
                    if(option.removeOnStop) elementsToRemove.push(node)
                    return node;
                }
            }

            function removeElements() {
                elementsToRemove.forEach(item => {
                    if(item) item.remove();
                })
                elementsToRemove = [];
            }

            function removeCustomFolderElements() {
                customFolders.forEach(item => {
                    if(item.element) item.element.remove();
                })

                customFolders = [];

                observers.forEach(item => {
                    if(item) item.disconnect()
                })

                observers = [];
            }

            function getFirstLetters(str) {
                const firstLetters = str
                  .split(' ')
                  .map(word => word[0])
                  .join('');
              
                return firstLetters;
            }

            function updateFolders() {
                console.log("folder updated")
                removeCustomFolderElements()
                let folders = DiscordModules.SortedGuildStore.guildFolders.filter(item => item.folderId != undefined)

                if(folders.length <= 0) return;
                folders.forEach(folder => {
                    let folderData = document.querySelector(`.folder-241Joy[aria-owns="folder-items-${folder.folderId}"]`)
                    
                    let folderElement = addElements("#folderOverlay", `<div data-show="${folderData.ariaExpanded}" class="${config.info.name}-folder" id="folderId-${folder.folderId}"></div>`, { position: "beforeend", removeOnStop: false })
                    addElements(`#${folderElement.id}`, `<div id="folderId-${folder.folderId}-guilds" class="${config.info.name}-folder-guilds"></div>`, { position: "beforeend", removeOnStop: false })
                    folder.guildIds.forEach(guildId => {
                        let guild = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("getGuild", "getGuilds")).getGuild(guildId)
                        let icon = guild.icon ? `<img src="https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64"/>` : `<div>${getFirstLetters(guild.name)}</div>`
                        let guildElement = addElements(`#folderId-${folder.folderId}-guilds`, `<div id="folderId-${folder.folderId}-${guildId}" class="${config.info.name}-folder-guild">${icon}</div>`, { position: "beforeend", removeOnStop: false })
                        guildElement.addEventListener("click", () => {
                            DiscordModules.GuildActions.transitionToGuildSync(guild.id)
                        })
                    })
                    customFolders.push({ folderId: folder.folderId, element: folderElement })

                    folderElement.setAttribute("style", `top: ${document.querySelector(`.folder-241Joy[aria-owns="folder-items-${folder.folderId}"]`).getClientRects()[0].y - 10}px;`)

                    document.querySelectorAll('.folder-241Joy[aria-owns^="folder-items-"]').forEach(normalFolder => {
                        const mutationObserver = new MutationObserver(() => {
                            let folder = document.getElementById(`folderId-${normalFolder.getAttribute("data-list-item-id").replace("guildsnav___", "")}`)
                            if(folder) folder.dataset.show = `${normalFolder.ariaExpanded}`
                        })
                        mutationObserver.observe(normalFolder, {attributes: true})
                        observers.push(mutationObserver)
                    })
                    
                    document.querySelector(".guilds-2JjMmN .tree-3agP2X .scroller-3X7KbA").addEventListener("scroll", () => {
                        folderElement.setAttribute("style", `top: ${document.querySelector(`.folder-241Joy[aria-owns="folder-items-${folder.folderId}"]`).getClientRects()[0].y - 10}px;`)
                    })
                })                
            }

            function rootCss(color) {
                let rootCss = `
                    :root,
                    ::before,
                    ::after {
                        --${config.info.name}-folder-background-color: ${color};
                    }
                `

                return rootCss;
            }

            return class NitroPerks extends Plugin {
                defaultSettings = {
                    backgroundColor: "#2c2c2c",
                };
                settings = PluginUtilities.loadSettings(this.getName(), this.defaultSettings);

                css = `
                    ul[id^="folder-items-"] {
                        display: none;
                    }

                    .${config.info.name}-folder {
                        --min-width: 110px;
                        --min-height: 60px;
                        background-color: var(--${config.info.name}-folder-background-color);
                        min-width: var(--min-width);
                        min-height: var(--min-height);
                        width: fit-content;
                        height: var(--min-height);
                        pointer-events: all;
                        position: fixed;
                        left: calc(72px + 20px);
                        border-radius: 15px;
                        padding: 5px;
                    }

                    .${config.info.name}-folder[data-show="false"] {
                        animation: ${config.info.name}-close-folder 1s forwards;
                    }

                    .${config.info.name}-folder[data-show="true"] {
                        animation-name: ${config.info.name}-open-folder;
                        animation-duration: 1s;
                        animation-iteration-count: 1;
                    }

                    @keyframes ${config.info.name}-open-folder {
                        from {transform: translateX(calc(-100% - 100px));}
                        to {transform: translateX(0);}
                    }

                    @keyframes ${config.info.name}-close-folder {
                        0% {transform: translateX(0);}
                        99.99% {transform: translateX(calc(-100% - 100px));}
                        100% { display: none; transform: translateX(calc(-100% - 100px)); }
                    } 

                    .${config.info.name}-folder[data-show="true"]::before {
                        content: '';
                        width: 0;
                        height: 0;
                        border-top: 15px solid transparent;
                        border-right: 20px solid var(--${config.info.name}-folder-background-color);
                        border-bottom: 15px solid transparent;
                        left: -20px;
                        top: calc(50% - 15px);
   	                    position: absolute;
                    }
                    
                    .${config.info.name}-folder-guilds {
                        margin: 0;
                        transform: translateY(10%);
                        overflow: hidden;
                    }

                    .${config.info.name}-folder-guild {
                        display: inline-block;
                        margin: 0 5px;
                        min-width: 50px;
                        min-height: 50px;
                        border-radius: 50px;
                        cursor: pointer;
                    }

                    .${config.info.name}-folder-guild img,
                    .${config.info.name}-folder-guild div {
                        transition: 0.2s ease;
                        width: 50px;
                        height: 50px;
                        border-radius: 50px;
                    }

                    .${config.info.name}-folder-guild:hover,
                    .${config.info.name}-folder-guild:hover img,
                    .${config.info.name}-folder-guild:hover div {
                        border-radius: 15px;
                        background-color: rgb(0 0 0 / 40%);
                    }

                    .${config.info.name}-folder-guild img {
                        
                    }

                    .${config.info.name}-folder-guild div {
                        text-align: center;
                        background-color: rgb(0 0 0 / 35%);
                        font-size: 100%;
                        line-height: 50px;
                    }
                `

                getSettingsPanel() {
                    return Settings.SettingPanel.build(_ => this.saveAndUpdate(), ...[
                        new Settings.ColorPicker("backgroundColor", "Set the color of the background when the folder is open", this.settings.backgroundColor, color => this.settings.backgroundColor = color)
                    ])
                }

                saveAndUpdate() {
                    PluginUtilities.saveSettings(this.getName(), this.settings)
                    PluginUtilities.removeStyle(`${this.getName()}-root`)
                    PluginUtilities.addStyle(`${this.getName()}-root`, rootCss(this.settings.backgroundColor));
                }

                setUp() {
                    PluginUtilities.addStyle(`${this.getName()}-css`, this.css);
                    PluginUtilities.addStyle(`${this.getName()}-root`, rootCss(this.settings.backgroundColor));
                    addElements(".notDevTools-1zkgfK > .layerContainer-2v_Sit", `<div id="folderOverlay"></div>`)

                    updateFolders()
                    DiscordModules.SortedGuildStore.addChangeListener(updateFolders)
                }

                onStart() {
                    this.setUp()
                }

                onStop() {
                    document.querySelector(".guilds-2JjMmN .tree-3agP2X .scroller-3X7KbA").removeEventListener("scroll");
                    removeElements()
                    removeCustomFolderElements()
                    DiscordModules.SortedGuildStore.removeChangeListener(updateFolders)
                    PluginUtilities.removeStyle(`${this.getName()}-css`);
                    PluginUtilities.removeStyle(`${this.getName()}-root`);
                    Patcher.unpatchAll();
                }
            };
        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
