/**
 * @name BetterServerFolders
 * @author Im_Banana#6112
 * @description Make The Server Folders Better!
 * @version 1.1.
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
            "version": "1.1.3",
            "description": "Make The Server Folders Better!",
            "github": "https://github.com/pronoob742/BetterServerFolders",
            "github_raw": "https://raw.githubusercontent.com/pronoob742/BetterServerFolders/main/BetterServerFolders.plugin.js"
        },
        "changelog": [
            // {
            //     "title": "New Stuff",
            //     "items": [
            //         "Added folder color for each folder."
            //     ]
            // }
            {
                "title": "Bugs Fixes",
                "type": "fixed",
                "items": [
                    "Fixed the folder color not updating correctly."
                ]
            }
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
            //         "More Setting coming soon... 👀"
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
                PluginUtilities,
                Tooltip,
                PluginUpdater,
                ReactTools,
                Modals,
                WebpackModules
            } = Api;

            let elementsToRemove = []

            let customFolders = []

            let observers = []

            let intervals = []

            let styles = []

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

                intervals.forEach(item => {
                    if(item) clearInterval(item)
                })

                intervals = []

                styles.forEach(item => {
                    PluginUtilities.removeStyle(item)
                })

                styles = []
            }

            function rootCss(backgroundColor, pingBackgroundColor) {
                let rootCss = `
                    :root,
                    ::before,
                    ::after {
                        --${config.info.name}-folder-background-color: ${backgroundColor};
                        --${config.info.name}-folder-ping-background-color: ${pingBackgroundColor};
                    }
                `

                return rootCss;
            }

            function settingsCss(element, backgroundColor) {
                PluginUtilities.removeStyle(`${config.info.name}-${element.id}`)

                let rootCss = `
                    #${element.id},
                    #${element.id}::before,
                    #${element.id}::after {
                        --${config.info.name}-folder-background-color: ${backgroundColor} !important;
                    }
                `

                PluginUtilities.addStyle(`${config.info.name}-${element.id}`, rootCss)
                styles.push(`${config.info.name}-${element.id}`)
            }

            function measureWidth(text, font) {
                const ele = document.createElement('div');
            
                ele.style.position = 'absolute';
                ele.style.visibility = 'hidden';
                ele.style.whiteSpace = 'nowrap';
                ele.style.left = '-9999px';
            
                ele.style.font = font;
                ele.innerText = text;
            
                document.body.appendChild(ele);

                const width = window.getComputedStyle(ele).width;
                document.body.removeChild(ele);
            
                return width;
            }

            function setFontScale(id) {
                const text = document.getElementById(id)
                if(!text) return;
                const styles = window.getComputedStyle(text);
                const font = styles.font;
                const fontSize = parseInt(styles.fontSize);
                const measured = measureWidth(text.textContent, font);
                const scale = text.clientWidth / parseFloat(measured);
                const scaleFontSize = Math.floor(scale * fontSize);
                text.style.fontSize = `${Math.min(20, scaleFontSize)}px`;
            }

            return class BetterServerFolders extends Plugin {
                defaultSettings = {
                    backgroundColor: "#2c2c2c",
                    pingBackgroundColor: "#ff0000",
                    folders: {}
                };
                settings = PluginUtilities.loadSettings(this.getName(), this.defaultSettings);

                css = `
                    ul[id^="folder-items-"]:not([data-editMode="true"]) {
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

                    .${config.info.name}-folder.${config.info.name}-no-anim[data-show="false"] {
                        display: none;
                    }

                    .${config.info.name}-folder[data-show="false"]:not(.${config.info.name}-no-anim) {
                        animation: ${config.info.name}-close-folder 1s forwards;
                    }
                    

                    .${config.info.name}-folder[data-show="true"]:not(.${config.info.name}-no-anim) {
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
                        overflow: hidden;
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
                    }

                    .${config.info.name}-folder-guild:hover div {
                        background-color: rgb(0 0 0 / 40%);
                    }

                    .${config.info.name}-folder-guild img {
                        
                    }

                    .${config.info.name}-folder-guild div {
                        text-align: center;
                        background-color: rgb(0 0 0 / 35%);
                        line-height: 50px;
                    }

                    .${config.info.name}-folder-settings-button {
                        transition: 0.2s ease;
                        width: 50px;
                        height: 50px;
                        min-width: 50px;
                        min-height: 50px;
                        border-radius: 50px;
                        display: inline-block;
                        margin: 0 5px;
                        cursor: pointer;
                        background-color: rgb(0 0 0 / 35%);
                        transform: translateY(-2.5px);
                    }

                    .${config.info.name}-folder-settings-button:hover {
                        border-radius: 15px;
                        background-color: rgb(0 0 0 / 40%);
                    }

                    .${config.info.name}-settings-icon {
                        transform: scale(75%);
                    }

                    .${config.info.name}-folder-guild-ping[data-count="0"] {
                        display: none;
                    }

                    .${config.info.name}-folder-guild-ping {
                        position: absolute;
                        background: var(--${config.info.name}-folder-ping-background-color) !important;
                        border-radius: 20px !important;
                        width: 20px !important;
                        height: 20px !important;
                        border-style: solid;
                        border-color: var(--${config.info.name}-folder-background-color);
                        border-width: 5px;
                        top: 30px;
                        left: 30px;
                        transform-origin: 0px 0px;
                    }

                    .${config.info.name}-folder-guild-ping span {
                        position: absolute;
                        top: -14px;
                        left: 5px;
                    }
                `

                updateFolders(plugin, options = { animation: false }) {
                    removeCustomFolderElements()
                    let folders = DiscordModules.SortedGuildStore.guildFolders.filter(item => item.folderId != undefined)
    
                    if(folders.length <= 0) return;
                    folders.forEach(folder => {
                        let mentionModule = WebpackModules.getByProps("getMentionCount")
                        let folderData = document.querySelector(`.folder-241Joy[aria-owns="folder-items-${folder.folderId}"]`)
                        
                        let folderElement = addElements("#folderOverlay", `<div data-show="${folderData.ariaExpanded}" class="${config.info.name}-folder ${options.animation ? "" : config.info.name + "-no-anim"}" id="folderId-${folder.folderId}"></div>`, { position: "beforeend", removeOnStop: false })
                        addElements(`#${folderElement.id}`, `<div id="folderId-${folder.folderId}-guilds" class="${config.info.name}-folder-guilds" style="background-color: ;"></div>`, { position: "beforeend", removeOnStop: false })
                        settingsCss(folderElement, this.settings.folders[folder.folderId] ? this.settings.folders[folder.folderId].color : this.settings.backgroundColor)
                        folder.guildIds.forEach(guildId => {
                            let guild = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("getGuild", "getGuilds")).getGuild(guildId)
                            
                            let icon = guild.icon ? `<img src="https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64"/>` : `<div id="folderId-${folder.folderId}-${guildId}-icon">${guild.acronym}</div>`
                            let guildElement = addElements(`#folderId-${folder.folderId}-guilds`, `<div id="folderId-${folder.folderId}-${guildId}" class="${config.info.name}-folder-guild">${icon}</div>`, { position: "beforeend", removeOnStop: false })
                            let mentions = mentionModule.getMentionCount(guild.id)
                            addElements(`#folderId-${folder.folderId}-${guildId}`, `<div id="folderId-${folder.folderId}-${guildId}-ping" class="${config.info.name}-folder-guild-ping" data-count="${mentions}"><span>${mentions}</span></div>`, { position: "beforeend", removeOnStop: false })
                            setFontScale(`folderId-${folder.folderId}-${guildId}-icon`)
                            guildElement.addEventListener("click", () => {
                                DiscordModules.GuildActions.transitionToGuildSync(guild.id)
                            })
                            Tooltip.create(guildElement, guild.name, { side: "bottom" })
                        })
    
                        let settingsIcon = `<svg viewBox="0 0 24 24" class="${config.info.name}-settings-icon"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M19.738 10H22V14H19.739C19.498 14.931 19.1 15.798 18.565 16.564L20 18L18 20L16.565 18.564C15.797 19.099 14.932 19.498 14 19.738V22H10V19.738C9.069 19.498 8.203 19.099 7.436 18.564L6 20L4 18L5.436 16.564C4.901 15.799 4.502 14.932 4.262 14H2V10H4.262C4.502 9.068 4.9 8.202 5.436 7.436L4 6L6 4L7.436 5.436C8.202 4.9 9.068 4.502 10 4.262V2H14V4.261C14.932 4.502 15.797 4.9 16.565 5.435L18 3.999L20 5.999L18.564 7.436C19.099 8.202 19.498 9.069 19.738 10ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"></path></svg>`
    
                        let settingButton = addElements(`#folderId-${folder.folderId}-guilds`, `<div id="folderId-${folder.folderId}-settings" class="${config.info.name}-folder-settings-button">${settingsIcon}</div>`, { position: 'beforeend', removeOnStop: false })
                        Tooltip.create(settingButton, "Settings", { side: "bottom" })
                        settingButton.addEventListener("click", () => {
                            plugin.showFolderSettingsPanel(folder.folderId)
                        })
    
                        customFolders.push({ folderId: folder.folderId, element: folderElement })
    
                        folderElement.setAttribute("style", `top: ${document.querySelector(`.folder-241Joy[aria-owns="folder-items-${folder.folderId}"]`).getClientRects()[0].y - 10}px;`)
                        
                        let isOpen = folderElement.getAttribute("data-show")

                        if(isOpen && document.querySelector(`ul[id="folder-items-${folder.folderId}"]`)) document.querySelector(`ul[id="folder-items-${folder.folderId}"]`).setAttribute("data-editMode", this.settings.folders[folder.folderId] ? this.settings.folders[folder.folderId].editMode : false)
                        
                        let normalFolder = document.querySelector(`.folder-241Joy[aria-owns="folder-items-${folder.folderId}"]`)
                        const mutationObserver = new MutationObserver(() => {
                            if(folderElement) {
                                let oldValue = folderElement.dataset.show
                                folderElement.dataset.show = `${normalFolder.ariaExpanded}`
                                if(normalFolder.ariaExpanded == 'true' && oldValue != folderElement.dataset.show) folderElement.classList.remove(`${config.info.name}-no-anim`)
                                isOpen = normalFolder.ariaExpanded
                                if(isOpen && document.querySelector(`ul[id="folder-items-${folder.folderId}"]`)) document.querySelector(`ul[id="folder-items-${folder.folderId}"]`).setAttribute("data-editMode", this.settings.folders[folder.folderId] ? this.settings.folders[folder.folderId].editMode : false)
                            }
                        })
                        mutationObserver.observe(normalFolder, {attributes: true})
                        observers.push(mutationObserver)

                        intervals.push(setInterval(() => {
                            let video = document.querySelector(".chat-2ZfjoI .wrapper-1gVUIN")
                            if(video) folderElement.setAttribute("data-show", video.classList.contains('fullScreen-KhZZcz') ? false : isOpen)
                        }, 1000))
    
                        let overlay = document.querySelector(".layer-86YKbF.baseLayer-W6S8cY")
                        let video = document.querySelector(".chat-2ZfjoI .wrapper-1gVUIN")
                        if(overlay && video) folderElement.setAttribute("data-show", (overlay.ariaHidden == 'true' || video.classList.contains('fullScreen-KhZZcz')) ? false : isOpen)

                        const overlayMutationObserver = new MutationObserver(() => {
                            let overlay = document.querySelector(".layer-86YKbF.baseLayer-W6S8cY")
                            let video = document.querySelector(".chat-2ZfjoI .wrapper-1gVUIN")
                            folderElement.setAttribute("data-show", ((overlay && overlay.ariaHidden == 'true') || (video && video.classList.contains('fullScreen-KhZZcz'))) ? false : isOpen)
                        })
    
                        overlayMutationObserver.observe(document.querySelector(".layer-86YKbF.baseLayer-W6S8cY"), { attributes: true })
                        observers.push(overlayMutationObserver)
                        
                        document.querySelector(".guilds-2JjMmN .tree-3agP2X .scroller-3X7KbA").addEventListener("scroll", () => {
                            folderElement.setAttribute("style", `top: ${document.querySelector(`.folder-241Joy[aria-owns="folder-items-${folder.folderId}"]`).getClientRects()[0].y - 10}px;`)
                        })
                    })                
                }

                updateFolderListener = () => this.updateFolders(this)

                getSettingsPanel() {
                    return Settings.SettingPanel.build(_ => this.saveAndUpdate(), ...[
                        new Settings.ColorPicker("Default Background Color", "Set the color of the Default background when the folder is open.", this.settings.backgroundColor, color => this.settings.backgroundColor = color),
                        new Settings.ColorPicker("Ping Background Color", "Set the ping (for the folder servers) background color.", this.settings.pingBackgroundColor, color => this.settings.pingBackgroundColor = color)
                    ])
                }

                getFolderSettingsPanel(id) {
                    return Settings.SettingPanel.build(_ => this.saveAndUpdateFolderSettings(id), ...[
                        new Settings.Textbox("Name", "Set the folder name.", this.settings.folders[id].name, (value) => { if(value.trim() != "") this.settings.folders[id].name = value; }, { placeholder: "Folder Name" }),
                        new Settings.Switch("Edit Mode", "Set the folder to edit mode to edit the folder guilds and more.", this.settings.folders[id].editMode, (value) => this.settings.folders[id].editMode = value),
                        new Settings.ColorPicker("Folder Color", "Folder background color", this.settings.folders[id].color, (value) => this.settings.folders[id].color = value)
                    ])
                }

                showFolderSettingsPanel(id) {
                    let folder = DiscordModules.SortedGuildStore.guildFolders.find(item => item.folderId == id)
                    if(!folder) return Toasts.error("Cant find the folder!");
                    if(!this.settings.folders[id]) {
                        this.settings.folders[id] = {
                            name: folder.folderName ? folder.folderName : "Unnamed",
                            editMode: false,
                            color: "#2c2c2c"
                        }
                    }
                    Modals.showModal(`${this.settings.folders[id].name} Folder Settings`, ReactTools.createWrappedElement(this.getFolderSettingsPanel(id)), { cancelText: "", confirmText: "Save", size: Modals.ModalSizes.MEDIUM })
                }

                saveAndUpdateFolderSettings(id) {
                    PluginUtilities.saveSettings(this.getName(), this.settings)
                    if(document.querySelector(`ul[id="folder-items-${id}"]`)) document.querySelector(`ul[id="folder-items-${id}"]`).setAttribute("data-editMode", this.settings.folders[id].editMode)
                    if(document.querySelector(`#folderId-${id}-settings`)) document.querySelector(`#folderId-${id}-settings`).setAttribute("data-color", this.settings.folders[id].color)
                    let cFolder = customFolders.find(folder => folder.folderId == id)
                    if(cFolder) settingsCss(cFolder.element, this.settings.folders[id] ? this.settings.folders[id].color : this.settings.backgroundColor)
                }

                saveAndUpdate() {
                    PluginUtilities.saveSettings(this.getName(), this.settings)
                    PluginUtilities.removeStyle(`${this.getName()}-root`)
                    PluginUtilities.addStyle(`${this.getName()}-root`, rootCss(this.settings.backgroundColor, this.settings.pingBackgroundColor));
                }

                setUp() {
                    PluginUtilities.addStyle(`${this.getName()}-css`, this.css);
                    PluginUtilities.addStyle(`${this.getName()}-root`, rootCss(this.settings.backgroundColor, this.settings.pingBackgroundColor));
                    addElements(".notDevTools-1zkgfK > .layerContainer-2v_Sit", `<div id="folderOverlay"></div>`)

                    this.updateFolders(this)
                    DiscordModules.SortedGuildStore.addChangeListener(this.updateFolderListener)
                    WebpackModules.getByProps("getMentionCount").addChangeListener(this.updateFolderListener)

                    this.updater = setInterval(() => {
                        PluginUpdater.checkForUpdate(config.info.name, config.info.version, config.info.github_raw)
                    }, 1000 * 60 * 60)

                }

                onStart() {
                    this.setUp()
                    PluginUpdater.checkForUpdate(config.info.name, config.info.version, config.info.github_raw)
                }

                onStop() {
                    DiscordModules.SortedGuildStore.removeChangeListener(this.updateFolderListener)
                    WebpackModules.getByProps("getMentionCount").removeChangeListener(this.updateFolderListener)
                    document.querySelector(".guilds-2JjMmN .tree-3agP2X .scroller-3X7KbA").removeEventListener("scroll");
                    removeElements()
                    removeCustomFolderElements()
                    PluginUtilities.removeStyle(`${this.getName()}-css`);
                    PluginUtilities.removeStyle(`${this.getName()}-root`);
                    clearInterval(this.updater)
                    Patcher.unpatchAll();
                }
            };
        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
